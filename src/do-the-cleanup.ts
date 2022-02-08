import chalk from 'chalk';
import { deleteBranch } from './bitbucket/delete-branch';

export async function doTheCleanup(
  workspace: (repo: string) => string,
  application: string,
  version: string,
  username: string,
  password: string,
  tenants: string[]
) {
  console.log(chalk.magenta(`\n› Cleaning up by removing temporary branches`));
  console.log(chalk.gray(`--------------------------------------------------------`));

  const credentials = { username, password };
  const branchData = { workspace: workspace(application), repo: application };

  await deleteBranch({ ...branchData, name: `release/${version}` }, credentials);

  for (const tenant of tenants) {
    await deleteBranch({ ...branchData, name: `release/${version}-${tenant}` }, credentials);
  }
}
