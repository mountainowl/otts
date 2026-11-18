const python =
  process.platform === 'win32'
    ? (Bun.which('py') ?? Bun.which('python') ?? 'py')
    : 'python3';
const run = (args) => {
  const result = Bun.spawnSync([python, ...args], {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  if (result.exitCode) process.exit(result.exitCode);
};

run(['-m', 'venv', '.venv']);
const environmentPython =
  process.platform === 'win32'
    ? '.venv\\Scripts\\python.exe'
    : '.venv/bin/python';
const result = Bun.spawnSync(
  [
    environmentPython,
    '-m',
    'pip',
    'install',
    '--requirement',
    'server/requirements.txt',
  ],
  { stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' },
);
if (result.exitCode) process.exit(result.exitCode);
console.log('DhVaani CPU service installed. Start with: bun run dev:cpu');
