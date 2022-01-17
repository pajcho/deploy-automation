import chalk from 'chalk';
import inquirer from 'inquirer';
import { DeployTenant } from '../models/deploy-settings.model';

export async function askForTenantSettings(): Promise<DeployTenant[]> {
  console.log(chalk.yellow('Settings | Setting up Tenant details...'));

  async function* tenantGenerator(maxTenants = 6): AsyncGenerator<DeployTenant> {
    let tenantCount = 1;

    while (tenantCount <= maxTenants) {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'loop',
          message: 'Add tenant application?',
          default: true,
          // eslint-disable-next-line no-loop-func
          when: () => maxTenants > tenantCount,
          prefix: chalk.blue('  +'),
        },
        {
          type: 'input',
          name: 'title',
          message: 'Enter tenant title:',
          validate(value: string) {
            return !/.+/.test(value) ? 'Tenant title is required' : true;
          },
          when: ({ loop }) => loop,
          prefix: chalk.green('  ?'),
        },
        {
          type: 'input',
          name: 'value',
          message: 'Enter tenant slug:',
          validate(value: string) {
            return !/.+/.test(value) ? 'Tenant slug is required' : true;
          },
          when: ({ loop }) => loop,
          prefix: chalk.green('  ?'),
        },
      ]);

      if (!answers.loop) {
        return;
      }

      yield {
        title: answers.title,
        value: answers.value,
      };

      tenantCount += 1;
    }
  }

  const tenants: DeployTenant[] = [];

  for await (const tenant of tenantGenerator()) {
    tenants.push(tenant);
  }

  return tenants;
}
