import { Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';

const ALLOWED_COMMANDS = ['ls', 'pwd', 'node', 'npm', 'python', 'python3', 'cat', 'echo', 'git', 'clear', 'whoami', 'date'];

export const executeTerminalCommand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { command, projectId } = req.body;

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

    const baseCommand = trimmedCommand.split(' ')[0];
    if (!ALLOWED_COMMANDS.includes(baseCommand)) {
      res.json({
        status: 'success',
        output: `bash: command not found or restricted: ${baseCommand}\nAllowed commands: ${ALLOWED_COMMANDS.join(', ')}`,
        exitCode: 127,
      });
      return;
    }

    // Default to workspace storage directory if projectId provided
    const targetDir = projectId
      ? path.join(process.cwd(), 'storage', projectId)
      : process.cwd();

    exec(trimmedCommand, { cwd: targetDir, timeout: 10000 }, (error, stdout, stderr) => {
      const output = (stdout || '') + (stderr || '');
      const exitCode = error ? error.code || 1 : 0;

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
