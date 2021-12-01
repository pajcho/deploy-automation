import prompts from 'prompts';
import chalk from 'chalk';
import { runCommand } from '../functions/run-command.js';
import { readFile } from '../functions/read-file.js';

export async function connectBitbucket() {
  console.log(chalk.yellow('Bitbucket | Validating credentials...'));

  const settings = JSON.parse(readFile('.deployrc.json'));
  const bitbucket = settings.connections?.bitbucket;

  // Check if credentials exist and are valid
  if (bitbucket && bitbucket.username && bitbucket.password) {
    console.log(chalk.green(`  Found credentials for user [${bitbucket.username}] in .deployrc.json file!`));

    return { username: bitbucket.username, password: bitbucket.password };
  } else {
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
        bitbucket: { username, password }
      };
      
      // Save credentials in the .deployrc file in this format username:password
      runCommand(`echo '${JSON.stringify(settings, null, 2)}' > .deployrc.json`);

      console.log(chalk.green(`  Credentials saved!`));

      return { username: username, password: password };
    }
  }
}
