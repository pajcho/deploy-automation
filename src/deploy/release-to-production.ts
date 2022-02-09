import chalk from 'chalk';
import { DeploySettings } from '../models/deploy-settings.model';
import { createPullRequest } from '../bitbucket/create-pull-request';
import { approvePullRequest } from '../bitbucket/approve-pull-request';
import { mergePullRequest } from '../bitbucket/merge-pull-request';
import { createTag } from '../bitbucket/create-tag';
import { mergeReleaseIntoDevelopment } from './merge-release-into-development';

export async function releaseToProduction(answers: any, application: string, settings: DeploySettings) {
  const { username, password } = settings.connections.bitbucket;
  const workspace = (repo: string): string => settings.applications.find((app) => app.value === repo)?.workspace || '';
  const mainBranch = (repo: string): string => settings.applications.find((app) => app.value === repo)?.mainBranch || '';

  console.log(chalk.magenta(`\n› Releasing version ${answers.version} to production on ${application}`));
  console.log(chalk.gray(`--------------------------------------------------------`));

  // TODO: Check if the branch is already up to date and skip this step completely

  // ## Open a PR and merge all changes from release branch
  const pullRequest = await createPullRequest(
    {
      workspace: workspace(application),
      repo: application,
      source: `release/${answers.version}`,
      destination: mainBranch(application),
      title: `v${answers.version} Release`,
    },
    { username, password }
  );

  if (pullRequest) {
    await approvePullRequest({ id: pullRequest.id, workspace: workspace(application), repo: application, title: pullRequest.title }, { username, password });
    const mergedPullRequest = await mergePullRequest(
      { id: pullRequest.id, workspace: workspace(application), repo: application, title: pullRequest.title },
      { username, password }
    );

    if (mergedPullRequest) {
      // ## Create a version tag on the merge commit
      await createTag({ workspace: workspace(application), repo: application, hash: mergedPullRequest.hash, name: answers.version }, { username, password });

      if (answers.syncBackToDevelopment) {
        await mergeReleaseIntoDevelopment(answers, application, settings);
      }
    }
  }
}
