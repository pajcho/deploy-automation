import chalk from 'chalk';
import { readFile } from './read-file';
import { DeploySettings } from '../models/deploy-settings.model';

export async function validateDeploySettings(): Promise<DeploySettings | false> {
  console.log(chalk.yellow('Settings | Validating deployrc.json file...'));

  try {
    const settings: DeploySettings = JSON.parse(readFile('.deployrc.json'));

    if (!settings.connections?.bitbucket) {
      console.log(chalk.red(`  ✖ Unable to find bitbucket connection settings in .deployrc.json file! Please use a template from .deployrc.example.json`));

      return false;
    }

    if (!settings.tenants?.length) {
      console.log(chalk.red(`  ✖ Unable to find tenants list in .deployrc.json file! Please use a template from .deployrc.example.json`));

      return false;
    }

    if (!settings.applications?.length) {
      console.log(chalk.red(`  ✖ Unable to find applications list in .deployrc.json file! Please use a template from .deployrc.example.json`));

      return false;
    }

    return settings;
  } catch {
    console.log(chalk.red(`  ✖ .deployrc.json file seems to be empty! Please use a template from .deployrc.example.json`));

    return false;
  }
}
