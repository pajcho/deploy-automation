import prompts from 'prompts';
import chalk from 'chalk';
import { runCommand } from '../helpers/run-command';
import { readFile } from '../helpers/read-file';
import { DeployConnection, DeploySettings } from '../models/deploy-settings.model';

export async function connectBitbucket(): Promise<DeployConnection | false> {
  console.log(chalk.yellow('Bitbucket | Validating credentials...'));

  const settings: DeploySettings = JSON.parse(readFile('.deployrc.json'));
  const bitbucket = settings.connections?.bitbucket;

  // Check if credentials exist and are valid
  if (bitbucket && bitbucket.username && bitbucket.password) {
    console.log(chalk.green(`  Found credentials for user [${bitbucket.username}] in .deployrc.json file!`));

    return { username: bitbucket.username, password: bitbucket.password };
  }
  const { username, password } = await prompts([
    {
      type: 'text',
      name: 'username',
      message: 'What is your Bitbucket username?',
      validate: (value) => (!value.length ? `Bitbucket username is required` : true),
    },
    {
      type: 'text',
      name: 'password',
      message: 'What is your Bitbucket "Application password"?',
      validate: (value) => (!value.length ? `Bitbucket password is required` : true),
    },
  ]);

  if (username && password) {
    settings.connections = {
      ...settings.connections,
      bitbucket: { username, password },
    };

    // Save credentials in the .deployrc file in this format username:password
    runCommand(`echo '${JSON.stringify(settings, null, 2)}' > .deployrc.json`);

    console.log(chalk.green(`  Credentials saved!`));

    return { username, password };
  }

  return false;
}