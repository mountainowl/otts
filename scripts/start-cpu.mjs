import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const python = resolve(
  root,
  '.venv',
  process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
);

if (!existsSync(python)) {
  console.error('CPU service is not installed. Run: npm run setup:cpu');
  process.exit(1);
}

const children = [
  spawn(python, ['server/dhvaani_server.py'], { cwd: root, stdio: 'inherit' }),
  spawn(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['dev'], {
    cwd: root,
    stdio: 'inherit',
  }),
];

const stop = () => children.forEach((child) => child.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
children.forEach((child) =>
  child.on('exit', (code) => code && process.exit(code)),
);
