import prompts from 'prompts';
import chalk from 'chalk';

import { validateDeploySettings } from './functions/validate-deploy-settings.js';
import { connectBitbucket } from './bitbucket/connect-bitbucket.js';
import { createBranch } from './bitbucket/create-branch.js';
import { readFile } from './bitbucket/read-file.js';
import { commitChanges } from './bitbucket/commit-changes.js';
import { deleteBranch } from './bitbucket/delete-branch.js';
import { createPullRequest } from './bitbucket/create-pull-request.js';
import { approvePullRequest } from './bitbucket/approve-pull-request.js';
import { mergePullRequest } from './bitbucket/merge-pull-request.js';
import {createTag} from "./bitbucket/create-tag.js";

async function deployRepository(username, password, settings) {
  let currentVersion;
  
  // Used while testing to quickly reset the repository state after changes
  const doTheCleanupBefore = false;
  const doTheCleanupAfter = false;
  const workspace = (repo) => settings.applications.find(app => app.value === repo).workspace;
  const mainBranch = (repo) => settings.applications.find(app => app.value === repo).mainBranch;
  const developmentBranch = (repo) => settings.applications.find(app => app.value === repo).developmentBranch;

  const { applications, tenants, syncBackToDevelopment,  environment, action, version, yes } = await prompts([
    {
      // TODO: We will deploy one app at a time in the future
      type: 'multiselect',
      name: 'applications',
      message: 'Pick applications you want to deploy',
      choices: settings.applications,
      min: 1,
    },
    {
      type: 'select',
      name: 'environment',
      message: 'Where do you want your action to take place?',
      choices: [
        { title: 'Staging (create or sync release branches)', value: 'staging' },
        { title: 'Production (release a version to production)', value: 'production' },
      ],
      initial: 0,
    },
    {
      type: 'select',
      name: 'action',
      message: 'Pick action you want me to do for you?',
      choices: (prev) =>
        prev === 'staging'
          ? [
              { title: 'Create release branch (from master synced with development)', value: 'new-release-branch' },
              { title: 'Create hotfix branch (from master)', value: 'new-hotfix-branch' },
              { title: 'Sync tenant branches with existing release branch (not working!!)', value: 'sync-with-existing-release' },
            ]
          : [{ title: 'Deploy the release to production', value: 'deploy-to-production' }],
    },
    {
      type: (prev) => {
        return prev === 'deploy-to-production' ? 'confirm' : 'multiselect';
      },
      name: (prev) => {
        return prev === 'deploy-to-production' ? 'syncBackToDevelopment' : 'tenants';
      },
      message: (prev) => {
        return prev === 'deploy-to-production' ? 'Sync back to development?' : 'Pick tenants you want to deploy';
      },
      choices: (prev) => {
        return ['new-release-branch', 'new-hotfix-branch', 'sync-with-existing-release'].includes(prev) ? settings.tenants : [];
      },
    },
    {
      // TODO: We will deploy one app at a time in the future so there will be no need to do values.applications[0]
      type: 'text',
      name: 'version',
      message: 'What is the version you want to use?',
      initial: async (prev, values) => {
        console.log(
          chalk.dim(
            `› Reading current version from remote repository (${workspace(values.applications[0])}/${values.applications[0]}/package.json)`
          )
        );
        const packageJsonContents = await readFile(
          { workspace: workspace(values.applications[0]), repo: values.applications[0], source: 'master', path: 'package.json' },
          { username, password },
          false
        );
        if (packageJsonContents) {
          currentVersion = packageJsonContents.version;

          return packageJsonContents.version;
        }

        console.log(chalk.red(`✖ Remote version could not be found.`));
        return null;
      },
      validate: (value) => (!value || value.length < 6 ? 'This is not a valid version number' : true),
    },
    {
      type: 'confirm',
      name: 'yes',
      message: `Ready to deploy?`,
      initial: true,
    },
  ]);

  if (yes) {
    // const currentBranch = execSync('git branch --show-current').toString();
    
    for (const application of applications) {
      if (doTheCleanupBefore) {
        await doTheCleanup(workspace, application, version, username, password, tenants);
      }

      if (['new-release-branch', 'new-hotfix-branch'].includes(action)) {
        console.log(chalk.magenta(`\n› Deploying release/${version} branch on ${application}`));
        console.log(chalk.gray(`--------------------------------------------------------`));

        // ## Create main release branch if new-release-branch
        // - Create new branch from master
        await createBranch(
          { workspace: workspace(application), repo: application, source: mainBranch(application), name: 'release/' + version },
          { username, password }
        );
  
        // TODO: Check if the branch already exists and do one of the following
        //  1. Skip this step completely (preferred method)
        //  2. Delete existing branch and recreate from scratch

        const commitData = {
          workspace: workspace(application),
          repo: application,
          target: 'release/' + version,
          message: 'chore: bump application version to ' + version,
          files: [],
        };

        // - Update package.json
        const packageJsonContents = await readFile(
          { workspace: workspace(application), repo: application, source: mainBranch(application), path: 'package.json' },
          { username, password }
        );
        if (packageJsonContents) {
          console.log(chalk.dim(`  › Updating release version from ${currentVersion} to ${version} in package.json`));
          commitData.files.push({
            path: 'package.json',
            contents: (JSON.stringify(packageJsonContents, null, 2) + '\n').replace(currentVersion, version),
          });
        }
        // - Update netlify.toml
        const netlifyTomlContents = await readFile(
          { workspace: workspace(application), repo: application, source: mainBranch(application), path: 'netlify.toml' },
          { username, password }
        );
        if (netlifyTomlContents) {
          console.log(chalk.dim(`  › Updating release version from ${currentVersion} to ${version} in netlify.toml`));
          commitData.files.push({
            path: 'netlify.toml',
            contents: netlifyTomlContents.replace(currentVersion, version),
          });
        }

        // - Commit changes
        await commitChanges(commitData, { username, password });

        // If we are creating a new release branch we need to pull in the latest changes from development
        if (action === 'new-release-branch') {
          // TODO: Check if the branch is already up to date and skip this step completely
          
          // ## Open a PR and merge all changes from development
          const pullRequest = await createPullRequest(
            {
              workspace: workspace(application),
              repo: application,
              source: developmentBranch(application),
              destination: 'release/' + version,
              title: 'v' + version + ' Staging',
            },
            { username, password }
          );

          if (pullRequest) {
            await approvePullRequest(
              { id: pullRequest.id, workspace: workspace(application), repo: application, title: 'v' + version + ' Staging' },
              { username, password }
            );
            await mergePullRequest(
              { id: pullRequest.id, workspace: workspace(application), repo: application, title: 'v' + version + ' Staging' },
              { username, password }
            );
          }
        }
      }

      // Skip any tenant related logic if it is not needed
      if (['new-release-branch', 'new-hotfix-branch', 'sync-with-existing-release'].includes(action)) {
        for (const tenant of tenants) {
          if (['new-release-branch', 'new-hotfix-branch'].includes(action)) {
            console.log(chalk.magenta(`\n› Deploying release/${version}-${tenant} branch on ${application}`));
            console.log(chalk.gray(`--------------------------------------------------------`));

            const mainReleaseBranch = 'release/' + version;
            const tenantReleaseBranch = mainReleaseBranch + '-' + tenant;

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
            };

            // - Update netlify.toml
            const netlifyTomlContents = await readFile(
              { workspace: workspace(application), repo: application, source: mainBranch(application), path: 'netlify.toml' },
              { username, password }
            );
            if (netlifyTomlContents) {
              console.log(
                chalk.dim(`  › Updating release version from ${currentVersion} to ${version}-${tenant} in netlify.toml`)
              );
              commitData.files.push({
                path: 'netlify.toml',
                contents: netlifyTomlContents.replace(currentVersion, `${version}-${tenant}`),
              });
            }

            // - Commit changes
            await commitChanges(commitData, { username, password });
          } else if (action === 'sync-with-existing-release') {
            console.log(chalk.magenta(`\n› Syncing release/${version}-${tenant} branch on ${application}`));
            console.log(chalk.gray(`--------------------------------------------------------`));

            // ## Sync tenant release branch
            // - Check if the branch is in sync already and skip this step
            // - Merge tenant branch with the main release branch (Bitbucket API does not support basic merge)
            //   Option 1: Merge through new pull request release -> tenant
            //   Option 2: Delete current branch and recreate from scratch
          }
        }
      }
      
      if(action === 'deploy-to-production') {
        console.log(chalk.magenta(`\n› Releasing version ${version} to production on ${application}`));
        console.log(chalk.gray(`--------------------------------------------------------`));
  
        // TODO: Check if the branch is already up to date and skip this step completely
        
        // ## Open a PR and merge all changes from release branch
        const pullRequest = await createPullRequest(
            {
              workspace: workspace(application),
              repo: application,
              source: 'release/' + version,
              destination: mainBranch(application),
              title: 'v' + version + ' Release',
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
          
          // ## Create a version tag on the merge commit
          await createTag(
              { workspace: workspace(application), repo: application, hash: mergedPullRequest.hash, name: version },
              { username, password }
          );
          
          if(syncBackToDevelopment) {
            console.log(chalk.magenta(`\n› Syncing version ${version} back to ${developmentBranch(application)} on ${application}`));
            console.log(chalk.gray(`--------------------------------------------------------`));
  
            // TODO: Check if the branch is already up to date and skip this step completely
            
            // ## Open a PR and merge all changes from master branch
            const pullRequest = await createPullRequest(
                {
                  workspace: workspace(application),
                  repo: application,
                  source: mainBranch(application),
                  destination: developmentBranch(application),
                  title: 'v' + version + ' Post release sync',
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
  
      if (doTheCleanupAfter) {
        await doTheCleanup(workspace, application, version, username, password, tenants);
      }
    }

    console.log(chalk.green(`\n✔ All applications are deployed!!\n\n`));
  }
}

const settings = await validateDeploySettings();
if(settings) {
  const { username, password } = await connectBitbucket();
  deployRepository(username, password, settings).then();
}

async function doTheCleanup(workspace, application, version, username, password, tenants) {
  console.log(chalk.magenta(`\n› Cleaning up by removing temporary branches`));
  console.log(chalk.gray(`--------------------------------------------------------`));
  await deleteBranch(
      {workspace: workspace(application), repo: application, name: 'release/' + version},
      {username, password}
  );
  for (const tenant of tenants) {
    await deleteBranch(
        {workspace: workspace(application), repo: application, name: 'release/' + version + '-' + tenant},
        {username, password}
    );
  }
}
