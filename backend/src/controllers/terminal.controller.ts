import { Request, Response } from 'express';
import { execFile, spawn } from 'child_process';
import fs from 'fs/promises';
import http from 'http';
import https from 'https';
import path from 'path';
import { Project } from '../models/Project';

const ALLOWED_COMMANDS: Record<string, string> = {
  ls: '/bin/ls',
  pwd: '/bin/pwd',
  echo: '/bin/echo',
  cat: '/bin/cat',
  node: '/usr/bin/node',
  npm: '/usr/bin/npm',
  python: '/usr/bin/python',
  python3: '/usr/bin/python3',
  git: '/usr/bin/git',
  whoami: '/usr/bin/whoami',
  date: '/bin/date',
};

const STORAGE_ROOT = path.resolve(__dirname, '..', '..', 'storage', 'projects');
const ACTIVE_PROJECT_RUNTIMES = new Map<
  string,
  { port: number; pid: number; internalUrl: string; publicUrl: string }
>();

const projectDirFor = (workspaceId?: string, projectId?: string): string => {
  if (workspaceId && projectId) return path.join(STORAGE_ROOT, String(workspaceId), String(projectId));
  if (projectId) return path.join(STORAGE_ROOT, String(projectId));
  return STORAGE_ROOT;
};

const detectRuntime = async (
  projectDir: string
): Promise<
  | { type: 'npm'; port: number; installArgs: string[]; launchArgs: string[] }
  | { type: 'python'; port: number; cmd: string; args: string[] }
  | null
> => {
  try {
   const packageJsonPath = path.join(projectDir, 'package.json');
   const packageJson = await fs.readFile(packageJsonPath, 'utf8');
   const pkg = JSON.parse(packageJson);
   const scripts = pkg?.scripts ?? {};
   const hasVite = pkg?.dependencies?.vite || pkg?.devDependencies?.vite || scripts.dev?.includes('vite');
   const useDevScript = Boolean(scripts.dev);
   const useStartScript = Boolean(scripts.start);

   if (hasVite || useDevScript) {
     return {
       type: 'npm',
       port: 5174,
       installArgs: ['install', '--silent'],
       launchArgs: ['run', 'dev', '--', '--host', '0.0.0.0', '--port', '5174'],
     };
   }

   if (pkg && (useStartScript || pkg.main || pkg.dependencies || pkg.devDependencies)) {
     return {
       type: 'npm',
       port: 3000,
       installArgs: ['install', '--silent'],
       launchArgs: ['start', '--', '--host', '0.0.0.0', '--port', '3000'],
     };
   }
  } catch {
   // ignore and fall through to static or Python checks
  }

  if (await fileExists(path.join(projectDir, 'index.html'))) {
   return { type: 'python', port: 4173, cmd: 'python3', args: ['-m', 'http.server', '4173'] };
  }

  if (await fileExists(path.join(projectDir, 'main.py'))) {
   return { type: 'python', port: 4173, cmd: 'python3', args: ['-m', 'http.server', '4173'] };
  }

  return null;
};

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
   await fs.access(filePath);
   return true;
  } catch {
   return false;
  }
};

const waitForExit = (child: ReturnType<typeof spawn>) =>
  new Promise<number>((resolve, reject) => {
   child.once('error', reject);
   child.once('close', (code) => resolve(code ?? 0));
  });

const buildPublicPreviewUrl = (req: Request, projectId: string): string => {
  const configuredBase = process.env.PUBLIC_PREVIEW_BASE?.replace(/\/$/, '');
  if (configuredBase) return `${configuredBase}/api/preview/${projectId}`;

  const forwardedProto = req.get('x-forwarded-proto') || req.protocol;
  const protocol = forwardedProto === 'https' ? 'https' : 'http';
  const host = req.get('host') || 'localhost:5000';
  return `${protocol}://${host}/api/preview/${projectId}`;
};

const proxyRequest = async (url: URL, req: Request, res: Response): Promise<void> => {
  const transport = url.protocol === 'https:' ? https : http;
  const method = req.method;
  const headers = { ...req.headers } as Record<string, string>;
  delete headers.host;
  delete headers.connection;
  delete headers['content-length'];

  const upstreamReq = transport.request(
   {
     hostname: url.hostname,
     port: url.port || (url.protocol === 'https:' ? '443' : '80'),
     path: `${url.pathname}${url.search}`,
     method,
     headers,
   },
   (upstreamRes) => {
     res.status(upstreamRes.statusCode ?? 200);
     Object.entries(upstreamRes.headers).forEach(([key, value]) => {
       if (!value) return;
       const headerValue = Array.isArray(value) ? value.join(',') : value;
       if (key.toLowerCase() === 'content-encoding') return;
       res.setHeader(key, headerValue);
     });
     upstreamRes.pipe(res);
   }
  );

  upstreamReq.on('error', (error) => {
   res.status(502).json({
     success: false,
     message: error.message || 'Failed to proxy preview request to the project runtime.',
   });
  });

  if (!['GET', 'HEAD'].includes(method)) {
   req.pipe(upstreamReq);
  } else {
   upstreamReq.end();
  }
};

const startRuntimeForProject = async (req: Request, projectId: string, workspaceId?: string): Promise<{ port: number; publicUrl: string } | null> => {
  const runtimeKey = String(projectId);
  const existing = ACTIVE_PROJECT_RUNTIMES.get(runtimeKey);
  if (existing) {
   return { port: existing.port, publicUrl: existing.publicUrl };
  }

  if (!workspaceId) {
   return null;
  }

  const projectDir = projectDirFor(workspaceId, projectId);
  const runtime = await detectRuntime(projectDir);
  if (!runtime) {
   return null;
  }

  const publicUrl = buildPublicPreviewUrl(req, projectId);

  if (runtime.type === 'npm') {
   const installChild = spawn('npm', runtime.installArgs, {
     cwd: projectDir,
     detached: true,
     stdio: 'ignore',
     env: { ...process.env, BROWSER: 'none' },
   });
   installChild.unref();
   await waitForExit(installChild);

   const runtimeChild = spawn('npm', runtime.launchArgs, {
     cwd: projectDir,
     detached: true,
     stdio: 'ignore',
     env: { ...process.env, BROWSER: 'none' },
   });
   runtimeChild.unref();
   ACTIVE_PROJECT_RUNTIMES.set(runtimeKey, {
     port: runtime.port,
     pid: runtimeChild.pid ?? 0,
     internalUrl: `http://127.0.0.1:${runtime.port}`,
     publicUrl,
   });
  } else {
   const staticChild = spawn(runtime.cmd, runtime.args, {
     cwd: projectDir,
     detached: true,
     stdio: 'ignore',
   });
   staticChild.unref();
   ACTIVE_PROJECT_RUNTIMES.set(runtimeKey, {
     port: runtime.port,
     pid: staticChild.pid ?? 0,
     internalUrl: `http://127.0.0.1:${runtime.port}`,
     publicUrl,
   });
  }

  return { port: runtime.port, publicUrl };
};

export const proxyProjectPreview = async (req: Request, res: Response): Promise<void> => {
  const projectId = String(req.params.projectId || '');
  let runtime = ACTIVE_PROJECT_RUNTIMES.get(projectId);

  if (!runtime) {
   const project = await Project.findById(projectId).lean().catch(() => null);
   const workspaceId = project?.workspaceId ? String(project.workspaceId) : undefined;
   const started = await startRuntimeForProject(req, projectId, workspaceId);
   runtime = started ? ACTIVE_PROJECT_RUNTIMES.get(projectId) ?? null : null;
  }

  if (!runtime) {
   res.status(404).json({
     success: false,
     message: 'Preview server has not started for this project yet.',
   });
   return;
  }

  res.removeHeader('X-Frame-Options');
  res.setHeader(
   'Content-Security-Policy',
   "frame-ancestors 'self' https://*.vercel.app https://*.netlify.app http://localhost:* https://localhost:*"
  );

  try {
   const originalPath = req.originalUrl.replace(/^\/api\/preview\/[^/]+/, '') || '/';
   const upstream = new URL(originalPath, `http://127.0.0.1:${runtime.port}`);
   upstream.protocol = 'http:';
   upstream.hostname = '127.0.0.1';
   upstream.port = String(runtime.port);
   await proxyRequest(upstream, req, res);
  } catch (error: any) {
   res.status(502).json({
     success: false,
     message: error.message || 'Failed to proxy preview request to the project runtime.',
   });
  }
};

export const startProjectRuntime = async (req: Request, res: Response): Promise<void> => {
  try {
   const { workspaceId, projectId } = req.body;
   if (!workspaceId || !projectId) {
     res.status(400).json({ status: 'error', message: 'workspaceId and projectId are required.' });
     return;
   }

   const runtimeKey = String(projectId);
   const existing = ACTIVE_PROJECT_RUNTIMES.get(runtimeKey);
   if (existing) {
     res.json({
       status: 'success',
       launched: false,
       alreadyRunning: true,
       url: existing.publicUrl,
       port: existing.port,
     });
     return;
   }

   const started = await startRuntimeForProject(req, projectId, workspaceId);
   if (!started) {
     res.status(400).json({
       status: 'error',
       message: 'This project type does not have an auto-start runtime configured yet.',
     });
     return;
   }

   res.json({
     status: 'success',
     launched: true,
     alreadyRunning: false,
     url: started.publicUrl,
     port: started.port,
   });
  } catch (error: any) {
   res.status(500).json({ status: 'error', message: error.message || 'Failed to start project runtime.' });
  }
};

export const executeTerminalCommand = async (req: Request, res: Response): Promise<void> => {
  try {
   const { command, projectId, workspaceId } = req.body;

   if (!command || typeof command !== 'string') {
     res.status(400).json({ status: 'error', message: 'Command string is required.' });
     return;
   }

   const trimmedCommand = command.trim();
   if (!trimmedCommand) {
     res.json({ status: 'success', output: '', exitCode: 0 });
     return;
   }

   if (trimmedCommand === 'clear') {
     res.json({ status: 'success', output: '', exitCode: 0 });
     return;
   }

   const parts = trimmedCommand.split(/\s+/);
   const baseCommand = parts[0];
   const args = parts.slice(1);

   const binaryPath = ALLOWED_COMMANDS[baseCommand];
   if (!binaryPath) {
     res.json({
       status: 'success',
       output: `bash: command not found or restricted: ${baseCommand}\nAllowed commands: ${Object.keys(ALLOWED_COMMANDS).join(', ')}`,
       exitCode: 127,
     });
     return;
   }

   const targetDir = projectDirFor(workspaceId, projectId);

   execFile(binaryPath, args, { cwd: targetDir, timeout: 10000 }, (error, stdout, stderr) => {
     const output = (stdout || '') + (stderr || '');
     const exitCode = error ? (error.code as number | undefined) ?? 1 : 0;

     res.json({
       status: 'success',
       output: output || (exitCode === 0 ? 'Command executed successfully.' : `Process exited with code ${exitCode}`),
       exitCode,
     });
   });
  } catch (error: any) {
   res.status(500).json({ status: 'error', message: error.message || 'Failed to execute terminal command' });
  }
};
