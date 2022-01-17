import chalk from 'chalk';
import { execSync } from 'node:child_process';

export function readFile(path: string, log = true): string {
  if (log) console.log(chalk.dim(`  Reading file contents: ${path}`));

  return execSync(`touch ${path} && cat ${path}`, { stdio: 'pipe' }).toString();
}
