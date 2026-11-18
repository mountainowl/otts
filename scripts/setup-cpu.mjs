import { spawnSync } from 'node:child_process';

const python = process.platform === 'win32' ? 'py' : 'python3';
const run = (args) => {
  const result = spawnSync(python, args, { stdio: 'inherit' });
  if (result.status) process.exit(result.status);
};

run(['-m', 'venv', '.venv']);
const environmentPython =
  process.platform === 'win32'
    ? '.venv\\Scripts\\python.exe'
    : '.venv/bin/python';
const result = spawnSync(
  environmentPython,
  ['-m', 'pip', 'install', '--requirement', 'server/requirements.txt'],
  { stdio: 'inherit' },
);
if (result.status) process.exit(result.status);
console.log('DhVaani CPU service installed. Start with: npm run dev:cpu');
