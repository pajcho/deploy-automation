import chalk from 'chalk';
import { DeploySettings } from '../models/deploy-settings.model';

export async function syncTenantReleaseBranch(tenant: string, answers: any, application: string, settings: DeploySettings) {
  console.log(chalk.magenta(`\n› Syncing release/${answers.version}-${tenant} branch on ${application}`));
  console.log(chalk.gray(`--------------------------------------------------------`));

  // ## Sync tenant release branch
  // - Check if the branch is in sync already and skip this step
  // - Merge tenant branch with the main release branch (Bitbucket API does not support basic merge)
  //   Option 1: Merge through new pull request release -> tenant
  //   Option 2: Delete current branch and recreate from scratch
}
