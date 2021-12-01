import chalk from 'chalk';
import { execSync } from 'child_process';

export function runCommand(command) {
  console.log(chalk.blue(`› Running command: ${command}`));
  const result = execSync(command, { stdio: 'pipe' })
    .toString()
    .split('\n')
    .map((line) => '    ' + line)
    .join('\n');

  // We have 4 space characters so, if exists, result must be longer
  if (result.length > 4) {
    console.log(chalk.dim(result));
  }
}
