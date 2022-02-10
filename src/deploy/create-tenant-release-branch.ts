import chalk from 'chalk';
import { DeploySettings } from '../models/deploy-settings.model';
import { createBranch } from '../bitbucket/create-branch';
import { CommitData } from '../models/bitbucket.model';
import { readFile } from '../bitbucket/read-file';
import { commitChanges } from '../bitbucket/commit-changes';

export async function createTenantReleaseBranch(tenant: string, answers: any, application: string, settings: DeploySettings) {
  const { username, password } = settings.connections.bitbucket;
  const workspace = (repo: string): string => settings.applications.find((app) => app.value === repo)?.workspace || '';

  console.log(chalk.magenta(`\n› Deploying release/${answers.version}-${tenant} branch on ${application}`));
  console.log(chalk.gray(`--------------------------------------------------------`));

  const mainReleaseBranch = `release/${answers.version}`;
  const tenantReleaseBranch = `${mainReleaseBranch}-${tenant}`;

  // ## Create tenant release branch
  const branch = await createBranch(
    { workspace: workspace(application), repo: application, source: mainReleaseBranch, name: tenantReleaseBranch },
    { username, password }
  );

  if (branch) {
    const commitData = {
      workspace: workspace(application),
      repo: application,
      target: tenantReleaseBranch,
      message: 'chore: deploy tenant to staging',
      files: [],
    } as CommitData;

    // - Update netlify.toml
    const netlifyTomlContents = await readFile(
      { workspace: workspace(application), repo: application, source: branch.data.target.hash, path: 'netlify.toml' },
      { username, password }
    );
    if (netlifyTomlContents) {
      console.log(chalk.dim(`  › Updating release version from ${answers.version} to ${answers.version}-${tenant} in netlify.toml`));
      commitData.files.push({
        path: 'netlify.toml',
        contents: netlifyTomlContents.replace(answers.version, `${answers.version}-${tenant}`),
      });
    }

    // - Commit changes
    await commitChanges(commitData, { username, password });
  }
}
