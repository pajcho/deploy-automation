import chalk from 'chalk';
import inquirer from 'inquirer';
import { DeploySettings } from './models/deploy-settings.model';
import { readFile } from './bitbucket/read-file';
import { generateSuggestedVersions } from './helpers/generate-suggested-versions';
import { listBranches } from './bitbucket/list-branches';
import { BranchResponse } from './models/bitbucket.model';

export async function askDeploymentQuestions(settings: DeploySettings) {
  let currentVersion = '';

  const workspace = (repo: string): string => settings.applications.find((app) => app.value === repo)?.workspace || '';
  const mainBranch = (repo: string): string => settings.applications.find((app) => app.value === repo)?.mainBranch || '';
  const { username, password } = settings.connections.bitbucket;

  const answers: any = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'applications',
      message: 'Pick applications you want to deploy:',
      choices: settings.applications.map((app) => ({ name: app.title, value: app.value })),
      validate(values) {
        return values.length < 1 ? 'Select at least one application to deploy' : true;
      },
    },
    {
      type: 'list',
      name: 'environment',
      message: 'Where do you want your action to take place?',
      choices: [
        { name: 'Staging (create or sync release branches)', value: 'staging', key: 's' },
        { name: 'Production (release a version to production)', value: 'production', key: 'p' },
      ],
    },

    // Staging specific
    {
      type: 'list',
      name: 'action',
      message: 'Pick action you want me to do for you:',
      choices: [
        { name: 'Create release branch (from master synced with development)', value: 'new-release-branch' },
        { name: 'Create hotfix branch (from master)', value: 'new-hotfix-branch' },
        {
          name: 'Sync tenant branches with existing release branch (not working!!)',
          value: 'sync-with-existing-release',
        },
      ],
      when: (answers) => answers.environment === 'staging',
    },
    {
      type: 'confirm',
      name: 'createTenantBranches',
      message: `Do you want to create tenant branches as well?`,
      when: (answers) => ['new-release-branch', 'new-hotfix-branch'].includes(answers.action),
    },
    {
      type: 'checkbox',
      name: 'tenants',
      message: 'Pick tenants you want to deploy and sync:',
      choices: settings.tenants.map((tenant) => ({ name: tenant.title, value: tenant.value })),
      when: (answers) => answers.createTenantBranches || answers.action === 'sync-with-existing-release',
      validate(values) {
        return values.length < 1 ? 'Select at least one tenant from the list' : true;
      },
    },
    {
      type: 'list',
      name: 'version',
      message: 'What is the version you want to use?',
      when: (answers) => ['new-release-branch', 'new-hotfix-branch'].includes(answers.action),
      choices: async (answers) => {
        const packageJsonContents = await readFile(
          {
            workspace: workspace(answers.applications[0]),
            repo: answers.applications[0],
            source: mainBranch(answers.applications[0]),
            path: 'package.json',
          },
          { username, password },
          false
        );
        if (packageJsonContents) {
          currentVersion = packageJsonContents.version;

          return generateSuggestedVersions(packageJsonContents.version, answers.action === 'new-hotfix-branch');
        }

        console.log(chalk.red(`✖ Remote version could not be found.`));
        return null;
      },
    },

    // Production specific
    {
      type: 'confirm',
      name: 'syncBackToDevelopment',
      message: 'Sync back to development?',
      when: (answers) => answers.environment === 'production',
    },

    // When syncing tenants on staging or deploying to production
    {
      type: 'list',
      name: 'version',
      message: 'Which branch do you want to use?',
      when: (answers) => answers.action === 'sync-with-existing-release' || answers.environment === 'production',
      choices: async (answers) => {
        try {
          const branches: BranchResponse[] | false = await listBranches(
            {
              workspace: workspace(answers.applications[0]),
              repo: answers.applications[0],
              source: '',
              name: '',
              query: `name ~ "release/" AND name !~ "-"`,
            },
            { username, password }
          );

          return branches.map((branch) => ({ name: branch.name, value: branch.name.split('/')?.[1] }));
        } catch (error: Error | any) {
          return [{ name: `${error.message} Press ENTER to exit.`, value: 'exit' }];
        }
      },
      loop: false,
    },
    {
      type: 'confirm',
      name: 'ready',
      message: `Ready to deploy?`,
      when: (answers) => answers.version !== 'exit',
    },
  ]);

  console.log({ ...answers, currentVersion });

  return { ...answers, currentVersion };
}
