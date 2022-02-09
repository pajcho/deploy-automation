import chalk from 'chalk';
import { deleteBranch } from '../bitbucket/delete-branch';
import { DeploySettings } from '../models/deploy-settings.model';

export async function doTheCleanup(answers: any, application: string, settings: DeploySettings) {
  const { username, password } = settings.connections.bitbucket;
  const workspace = (repo: string): string => settings.applications.find((app) => app.value === repo)?.workspace || '';

  console.log(chalk.magenta(`\n› Cleaning up by removing temporary branches`));
  console.log(chalk.gray(`--------------------------------------------------------`));

  const credentials = { username, password };
  const branchData = { workspace: workspace(application), repo: application };

  await deleteBranch({ ...branchData, name: `release/${answers.version}` }, credentials);

  for (const tenant of answers.tenants || []) {
    await deleteBranch({ ...branchData, name: `release/${answers.version}-${tenant}` }, credentials);
  }
}
