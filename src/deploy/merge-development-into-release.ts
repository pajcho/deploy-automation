import { DeploySettings } from '../models/deploy-settings.model';
import { createPullRequest } from '../bitbucket/create-pull-request';
import { approvePullRequest } from '../bitbucket/approve-pull-request';
import { mergePullRequest } from '../bitbucket/merge-pull-request';

export async function mergeDevelopmentIntoRelease(answers: any, application: string, settings: DeploySettings) {
  const { username, password } = settings.connections.bitbucket;
  const workspace = (repo: string): string => settings.applications.find((app) => app.value === repo)?.workspace || '';
  const developmentBranch = (repo: string): string => settings.applications.find((app) => app.value === repo)?.developmentBranch || '';

  // TODO: Check if the branch is already up to date and skip this step completely

  // ## Open a PR and merge all changes from development
  const pullRequest = await createPullRequest(
    {
      workspace: workspace(application),
      repo: application,
      source: developmentBranch(application),
      destination: `release/${answers.version}`,
      title: `v${answers.version} Staging`,
    },
    { username, password }
  );

  if (pullRequest) {
    await approvePullRequest(
      {
        id: pullRequest.id,
        workspace: workspace(application),
        repo: application,
        title: `v${answers.version} Staging`,
      },
      { username, password }
    );
    await mergePullRequest(
      {
        id: pullRequest.id,
        workspace: workspace(application),
        repo: application,
        title: `v${answers.version} Staging`,
      },
      { username, password }
    );
  }
}
