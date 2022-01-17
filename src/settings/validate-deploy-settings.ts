import chalk from 'chalk';
import { readFile } from '../helpers/read-file';
import { DeploySettings } from '../models/deploy-settings.model';
import { runCommand } from '../helpers/run-command';
import { askForBitbucketConnectionSettings } from './ask-for-bitbucket-connection-settings';
import { askForApplicationSettings } from './ask-for-application-settings';
import { askForTenantSettings } from './ask-for-tenant-settings';

export async function validateDeploySettings(): Promise<DeploySettings | false> {
  let settings: DeploySettings;
  let settingsUpdated = false;

  console.log(chalk.yellow('Settings | Validating deployrc.json file...'));

  try {
    settings = JSON.parse(readFile('.deployrc.json', false));

    if (!settings.connections?.bitbucket) {
      console.log(chalk.red(`  ✖ Unable to find bitbucket connection settings in .deployrc.json file! Follow the interactive guide and fill in the settings.`));

      settings.connections = { ...settings.connections, ...(await askForBitbucketConnectionSettings()) };
      settingsUpdated = true;
    }

    if (!settings.applications?.length) {
      console.log(chalk.red(`  ✖ Unable to find applications list in .deployrc.json file! Follow the interactive guide and fill in the settings.`));

      settings.applications = await askForApplicationSettings();
      settingsUpdated = true;
    }

    if (!settings.tenants?.length) {
      console.log(chalk.red(`  ✖ Unable to find tenants list in .deployrc.json file! Follow the interactive guide and fill in the settings.`));

      settings.tenants = await askForTenantSettings();
      settingsUpdated = true;
    }
  } catch {
    console.log(chalk.red(`  ✖ .deployrc.json file seems to be missing or empty! Follow the interactive guide and fill in the settings.`));

    const connections = await askForBitbucketConnectionSettings();
    const applications = await askForApplicationSettings();
    const tenants = await askForTenantSettings();

    settings = { connections, applications, tenants };

    settingsUpdated = true;
  }

  if (settingsUpdated) {
    // Save credentials in the .deployrc file in this format username:password
    runCommand(`echo '${JSON.stringify(settings, null, 2)}' > .deployrc.json`, false);

    console.log(chalk.green(`  Deployment settings saved!`));
  }

  return settings;
}
