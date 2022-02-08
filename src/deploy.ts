import chalk from 'chalk';
import { createBranch } from './bitbucket/create-branch';
import { readFile } from './bitbucket/read-file';
import { commitChanges } from './bitbucket/commit-changes';
import { createPullRequest } from './bitbucket/create-pull-request';
import { approvePullRequest } from './bitbucket/approve-pull-request';
import { mergePullRequest } from './bitbucket/merge-pull-request';
import { createTag } from './bitbucket/create-tag';
import { DeploySettings } from './models/deploy-settings.model';
import { CommitData } from './models/bitbucket.model';
import { validateDeploySettings } from './settings/validate-deploy-settings';
import { askDeploymentQuestions } from './ask-deployment-questions';
import { doTheCleanup } from './do-the-cleanup';

async function deployRepository(answers: any, settings: DeploySettings) {
  if (!answers.ready) return;

  const currentVersion = '';

  // Used while testing to quickly reset the repository state after changes
  const doTheCleanupBefore = false;
  const doTheCleanupAfter = false;

  const { username, password } = settings.connections.bitbucket;
  const workspace = (repo: string): string => settings.applications.find((app) => app.value === repo)?.workspace || '';
  const mainBranch = (repo: string): string => settings.applications.find((app) => app.value === repo)?.mainBranch || '';
  const developmentBranch = (repo: string): string => settings.applications.find((app) => app.value === repo)?.developmentBranch || '';

  // const currentBranch = execSync('git branch --show-current').toString();

  for (const application of answers.applications) {
    if (doTheCleanupBefore) {
      await doTheCleanup(workspace, application, answers.version, username, password, answers.tenants);
    }

    if (['new-release-branch', 'new-hotfix-branch'].includes(answers.action)) {
      console.log(chalk.magenta(`\n› Deploying release/${answers.version} branch on ${application}`));
      console.log(chalk.gray(`--------------------------------------------------------`));

      // ## Create main release branch if new-release-branch
      // - Create new branch from master
      await createBranch(
        { workspace: workspace(application), repo: application, source: mainBranch(application), name: `release/${answers.version}` },
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
        console.log(chalk.dim(`  › Updating release version from ${currentVersion} to ${answers.version} in package.json`));
        commitData.files.push({
          path: 'package.json',
          contents: `${JSON.stringify(packageJsonContents, null, 2)}\n`.replace(currentVersion, answers.version),
        });
      }
      // - Update netlify.toml
      const netlifyTomlContents = await readFile(
        { workspace: workspace(application), repo: application, source: mainBranch(application), path: 'netlify.toml' },
        { username, password }
      );
      if (netlifyTomlContents) {
        console.log(chalk.dim(`  › Updating release version from ${currentVersion} to ${answers.version} in netlify.toml`));
        commitData.files.push({
          path: 'netlify.toml',
          contents: netlifyTomlContents.replace(currentVersion, answers.version),
        });
      }

      // - Commit changes
      await commitChanges(commitData, { username, password });

      // If we are creating a new release branch we need to pull in the latest changes from development
      if (answers.action === 'new-release-branch') {
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
            { id: pullRequest.id, workspace: workspace(application), repo: application, title: `v${answers.version} Staging` },
            { username, password }
          );
          await mergePullRequest(
            { id: pullRequest.id, workspace: workspace(application), repo: application, title: `v${answers.version} Staging` },
            { username, password }
          );
        }
      }
    }

    // Skip any tenant related logic if it is not needed
    if (['new-release-branch', 'new-hotfix-branch', 'sync-with-existing-release'].includes(answers.action)) {
      for (const tenant of answers.tenants) {
        if (['new-release-branch', 'new-hotfix-branch'].includes(answers.action)) {
          console.log(chalk.magenta(`\n› Deploying release/${answers.version}-${tenant} branch on ${application}`));
          console.log(chalk.gray(`--------------------------------------------------------`));

          const mainReleaseBranch = `release/${answers.version}`;
          const tenantReleaseBranch = `${mainReleaseBranch}-${tenant}`;

          // ## Create tenant release branch
          await createBranch(
            { workspace: workspace(application), repo: application, source: mainReleaseBranch, name: tenantReleaseBranch },
            { username, password }
          );

          // TODO: Check if the branch already exists and do one of the following
          //  1. Skip this step completely (preferred method)
          //  2. Delete existing branch and recreate from scratch

          const commitData = {
            workspace: workspace(application),
            repo: application,
            target: tenantReleaseBranch,
            message: 'chore: deploy tenant to staging',
            files: [],
          } as CommitData;

          // - Update netlify.toml
          const netlifyTomlContents = await readFile(
            { workspace: workspace(application), repo: application, source: mainBranch(application), path: 'netlify.toml' },
            { username, password }
          );
          if (netlifyTomlContents) {
            console.log(chalk.dim(`  › Updating release version from ${currentVersion} to ${answers.version}-${tenant} in netlify.toml`));
            commitData.files.push({
              path: 'netlify.toml',
              contents: netlifyTomlContents.replace(currentVersion, `${answers.version}-${tenant}`),
            });
          }

          // - Commit changes
          await commitChanges(commitData, { username, password });
        } else if (answers.action === 'sync-with-existing-release') {
          console.log(chalk.magenta(`\n› Syncing release/${answers.version}-${tenant} branch on ${application}`));
          console.log(chalk.gray(`--------------------------------------------------------`));

          // ## Sync tenant release branch
          // - Check if the branch is in sync already and skip this step
          // - Merge tenant branch with the main release branch (Bitbucket API does not support basic merge)
          //   Option 1: Merge through new pull request release -> tenant
          //   Option 2: Delete current branch and recreate from scratch
        }
      }
    }

    if (answers.action === 'deploy-to-production') {
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
        await approvePullRequest(
          { id: pullRequest.id, workspace: workspace(application), repo: application, title: pullRequest.title },
          { username, password }
        );
        const mergedPullRequest = await mergePullRequest(
          { id: pullRequest.id, workspace: workspace(application), repo: application, title: pullRequest.title },
          { username, password }
        );

        if (mergedPullRequest) {
          // ## Create a version tag on the merge commit
          await createTag(
            { workspace: workspace(application), repo: application, hash: mergedPullRequest.hash, name: answers.version },
            { username, password }
          );

          if (answers.syncBackToDevelopment) {
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
              await approvePullRequest(
                { id: pullRequest.id, workspace: workspace(application), repo: application, title: pullRequest.title },
                { username, password }
              );
              await mergePullRequest(
                { id: pullRequest.id, workspace: workspace(application), repo: application, title: pullRequest.title },
                { username, password }
              );
            }
          }
        }
      }
    }

    if (doTheCleanupAfter) {
      await doTheCleanup(workspace, application, answers.version, username, password, answers.tenants);
    }
  }

  console.log(chalk.green(`\n✔ All applications are deployed!!\n\n`));
}

async function deploy() {
  const settings = await validateDeploySettings();
  const answers = await askDeploymentQuestions(settings);

  await deployRepository(answers, settings);
}

deploy().then();
