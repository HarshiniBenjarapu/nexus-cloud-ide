import { Request, Response } from 'express';
import { execFile } from 'child_process';
import path from 'path';

/**
 * Allowed commands and their absolute binary paths.
 * Using execFile (not exec) prevents shell injection — arguments are passed
 * directly to the OS without a shell interpreter, so `npm; rm -rf /` is safe.
 */
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

/**
 * Project files live at: backend/storage/projects/<workspaceId>/<projectId>
 * The terminal should run commands inside that directory, or fall back to
 * the storage root if no projectId is given.
 */
const STORAGE_ROOT = path.resolve(__dirname, '..', '..', 'storage', 'projects');

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

    // Resolve the correct project directory
    let targetDir: string;
    if (projectId && workspaceId) {
      targetDir = path.join(STORAGE_ROOT, String(workspaceId), String(projectId));
    } else if (projectId) {
      // Fallback: try to find a matching subdir under any workspace
      targetDir = path.join(STORAGE_ROOT, String(projectId));
    } else {
      targetDir = STORAGE_ROOT;
    }

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
