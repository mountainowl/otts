import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const python = resolve(
  root,
  '.venv',
  process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
);

if (!existsSync(python)) {
  console.error('CPU service is not installed. Run: bun run setup:cpu');
  process.exit(1);
}

const children = [
  Bun.spawn([python, 'server/dhvaani_server.py'], {
    cwd: root,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  }),
  Bun.spawn(
    [
      process.execPath,
      'run',
      'dev',
      ...(process.env.VAANI_OPEN_BROWSER === '1'
        ? ['--', '--open', '/#workspace']
        : []),
    ],
    {
      cwd: root,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    },
  ),
];

const stop = () => children.forEach((child) => child.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
children.forEach((child) =>
  child.exited.then((code) => code && process.exit(code)),
);
