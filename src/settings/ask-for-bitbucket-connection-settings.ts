import chalk from 'chalk';
import inquirer, { Answers } from 'inquirer';
import { DeployConnection } from '../models/deploy-settings.model';

export async function askForBitbucketConnectionSettings(): Promise<Record<string, DeployConnection>> {
  console.log(chalk.yellow('Settings | Setting up Bitbucket credentials...'));

  return inquirer
    .prompt([
      {
        type: 'input',
        name: 'username',
        message: 'What is your Bitbucket username?',
        validate(value: string) {
          return !/.+/.test(value) ? 'Bitbucket username is required' : true;
        },
        prefix: chalk.green('  ?'),
      },
      {
        type: 'password',
        name: 'password',
        message: 'What is your Bitbucket password?',
        validate(value: string) {
          return !/.+/.test(value) ? 'Bitbucket password is required' : true;
        },
        prefix: chalk.green('  ?'),
      },
    ])
    .then((answers: Answers) => {
      return {
        bitbucket: {
          username: answers.username,
          password: answers.password,
        },
      };
    });
}
