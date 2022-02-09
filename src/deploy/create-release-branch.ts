import chalk from 'chalk';
import { DeploySettings } from '../models/deploy-settings.model';
import { createBranch } from '../bitbucket/create-branch';
import { CommitData } from '../models/bitbucket.model';
import { readFile } from '../bitbucket/read-file';
import { commitChanges } from '../bitbucket/commit-changes';

export async function createReleaseBranch(answers: any, application: string, settings: DeploySettings) {
  const { username, password } = settings.connections.bitbucket;
  const workspace = (repo: string): string => settings.applications.find((app) => app.value === repo)?.workspace || '';
  const mainBranch = (repo: string): string => settings.applications.find((app) => app.value === repo)?.mainBranch || '';

  console.log(chalk.magenta(`\n› Deploying release/${answers.version} branch on ${application}`));
  console.log(chalk.gray(`--------------------------------------------------------`));

  // ## Create main release branch if new-release-branch
  // - Create new branch from master
  await createBranch(
    {
      workspace: workspace(application),
      repo: application,
      source: mainBranch(application),
      name: `release/${answers.version}`,
    },
    { username, password }
  );

  // TODO: Check if the branch already exists and do one of the following
  //  1. Skip this step completely (preferred method)
  //  2. Delete existing branch and recreate from scratch

  const commitData = {
    workspace: workspace(application),
    repo: application,
    target: `release/${answers.version}`,
    message: `chore: bump application version to ${answers.version}`,
    files: [],
  } as CommitData;

  // - Update package.json
  const packageJsonContents = await readFile(
    { workspace: workspace(application), repo: application, source: mainBranch(application), path: 'package.json' },
    { username, password }
  );
  if (packageJsonContents) {
    console.log(chalk.dim(`  › Updating release version from ${answers.currentVersion} to ${answers.version} in package.json`));
    commitData.files.push({
      path: 'package.json',
      contents: `${JSON.stringify(packageJsonContents, null, 2)}\n`.replace(answers.currentVersion, answers.version),
    });
  }
  // - Update netlify.toml
  const netlifyTomlContents = await readFile(
    { workspace: workspace(application), repo: application, source: mainBranch(application), path: 'netlify.toml' },
    { username, password }
  );
  if (netlifyTomlContents) {
    console.log(chalk.dim(`  › Updating release version from ${answers.currentVersion} to ${answers.version} in netlify.toml`));
    commitData.files.push({
      path: 'netlify.toml',
      contents: netlifyTomlContents.replace(answers.currentVersion, answers.version),
    });
  }

  // - Commit changes
  await commitChanges(commitData, { username, password });
}
