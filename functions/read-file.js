import chalk from 'chalk';
import { execSync } from 'child_process';

export function readFile(path) {
  console.log(chalk.dim(`  Reading file contents: ${path}`));
  return execSync(`touch ${path} && cat ${path}`, { stdio: 'pipe' }).toString();
}
