import chalk from 'chalk';
import { execSync } from 'node:child_process';

export function runCommand(command: string, log = true): void {
  if (log) console.log(chalk.blue(`› Running command: ${command}`));

  const result = execSync(command, { stdio: 'pipe' })
    .toString()
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n');

  // We have 4 space characters so, if exists, result must be longer
  if (log && result.length > 4) {
    console.log(chalk.dim(result));
  }
}
