import chalk from 'chalk';
import { execSync } from 'node:child_process';

export function readFile(path: string): string {
  console.log(chalk.dim(`  Reading file contents: ${path}`));
  return execSync(`touch ${path} && cat ${path}`, { stdio: 'pipe' }).toString();
}
