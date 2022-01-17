import chalk from 'chalk';
import inquirer from 'inquirer';
import { DeployApplication } from '../models/deploy-settings.model';

export async function askForApplicationSettings(): Promise<DeployApplication[]> {
  console.log(chalk.yellow('Settings | Setting up Application details...'));

  async function* applicationGenerator(maxApplications = 4): AsyncGenerator<DeployApplication> {
    let applicationCount = 1;

    while (applicationCount <= maxApplications) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Enter application title:',
          validate(value: string) {
            return !/.+/.test(value) ? 'Application title is required' : true;
          },
          prefix: chalk.green('  ?'),
        },
        {
          type: 'input',
          name: 'value',
          message: 'Enter application repo name:',
          validate(value: string) {
            return !/.+/.test(value) ? 'Repo name is required' : true;
          },
          prefix: chalk.green('  ?'),
        },
        {
          type: 'input',
          name: 'workspace',
          message: 'Enter application workspace:',
          validate(value: string) {
            return !/.+/.test(value) ? 'Workspace is required' : true;
          },
          prefix: chalk.green('  ?'),
        },
        {
          type: 'input',
          name: 'mainBranch',
          message: 'Enter application main branch name:',
          validate(value: string) {
            return !/.+/.test(value) ? 'Main branch name is required' : true;
          },
          prefix: chalk.green('  ?'),
        },
        {
          type: 'input',
          name: 'developmentBranch',
          message: 'Enter application development branch name:',
          validate(value: string) {
            return !/.+/.test(value) ? 'Development branch name is required' : true;
          },
          prefix: chalk.green('  ?'),
        },
        {
          type: 'confirm',
          name: 'loop',
          message: 'Add another application?',
          default: true,
          // eslint-disable-next-line no-loop-func
          when: () => maxApplications > applicationCount,
          prefix: chalk.blue('  +'),
        },
      ]);

      yield {
        title: answers.title,
        value: answers.value,
        workspace: answers.workspace,
        mainBranch: answers.mainBranch,
        developmentBranch: answers.developmentBranch,
      };

      if (!answers.loop) {
        return;
      }

      applicationCount += 1;
    }
  }

  const applications: DeployApplication[] = [];

  for await (const application of applicationGenerator()) {
    applications.push(application);
  }

  return applications;
}
