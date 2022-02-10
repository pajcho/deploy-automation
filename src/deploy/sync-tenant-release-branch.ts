import chalk from 'chalk';
import { DeploySettings } from '../models/deploy-settings.model';
import { deleteBranch } from '../bitbucket/delete-branch';
import { createTenantReleaseBranch } from './create-tenant-release-branch';

export async function syncTenantReleaseBranch(tenant: string, answers: any, application: string, settings: DeploySettings) {
  const { username, password } = settings.connections.bitbucket;
  const workspace = (repo: string): string => settings.applications.find((app) => app.value === repo)?.workspace || '';

  console.log(chalk.magenta(`\n› Syncing release/${answers.version}-${tenant} branch on ${application}`));
  console.log(chalk.gray(`--------------------------------------------------------`));

  // Step 1: delete tenant branch
  const branchData = { workspace: workspace(application), repo: application };
  await deleteBranch({ ...branchData, name: `release/${answers.version}-${tenant}` }, { username, password });

  // Step 2: Recreate tenant branch from master branch
  await createTenantReleaseBranch(tenant, answers, application, settings);
}
