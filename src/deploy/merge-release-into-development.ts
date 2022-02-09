import chalk from 'chalk';
import { DeploySettings } from '../models/deploy-settings.model';
import { createPullRequest } from '../bitbucket/create-pull-request';
import { approvePullRequest } from '../bitbucket/approve-pull-request';
import { mergePullRequest } from '../bitbucket/merge-pull-request';

export async function mergeReleaseIntoDevelopment(answers: any, application: string, settings: DeploySettings) {
  const { username, password } = settings.connections.bitbucket;
  const workspace = (repo: string): string => settings.applications.find((app) => app.value === repo)?.workspace || '';
  const mainBranch = (repo: string): string => settings.applications.find((app) => app.value === repo)?.mainBranch || '';
  const developmentBranch = (repo: string): string => settings.applications.find((app) => app.value === repo)?.developmentBranch || '';

  console.log(chalk.magenta(`\n› Syncing version ${answers.version} back to ${developmentBranch(application)} on ${application}`));
  console.log(chalk.gray(`--------------------------------------------------------`));

  // TODO: Check if the branch is already up to date and skip this step completely

  // ## Open a PR and merge all changes from master branch
  const pullRequest = await createPullRequest(
    {
      workspace: workspace(application),
      repo: application,
      source: mainBranch(application),
      destination: developmentBranch(application),
      title: `v${answers.version} Post release sync`,
    },
    { username, password }
  );

  if (pullRequest) {
    // TODO: This might be converted to a helper method, ie. approveAndMergePullRequest(pullRequest, application)
    await approvePullRequest({ id: pullRequest.id, workspace: workspace(application), repo: application, title: pullRequest.title }, { username, password });
    await mergePullRequest({ id: pullRequest.id, workspace: workspace(application), repo: application, title: pullRequest.title }, { username, password });
  }
}
