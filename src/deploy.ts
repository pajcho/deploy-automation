import chalk from 'chalk';
import { validateDeploySettings } from './settings/validate-deploy-settings';
import { askDeploymentQuestions } from './deploy/ask-deployment-questions';
import { Deployment } from './deployment/deployment';

async function deploy() {
  const settings = await validateDeploySettings();
  const answers = await askDeploymentQuestions(settings);

  if (!answers.ready) return;

  const deployment = new Deployment(settings, answers);
  deployment.clean.shouldCleanAfter = false;

  for (const application of answers.applications) {
    await deployment.clean.before(application);

    if (answers.environment === 'staging') {
      if (['new-release-branch', 'new-hotfix-branch'].includes(answers.action)) {
        await deployment.createReleaseBranch(application);

        // If we are creating a new release branch we need to pull in the latest changes from development
        if (answers.action === 'new-release-branch') {
          await deployment.mergeDevelopmentIntoRelease(application);
        }
      }

      for (const tenant of answers.tenants || []) {
        if (['new-release-branch', 'new-hotfix-branch'].includes(answers.action)) {
          await deployment.createTenantReleaseBranch(tenant, application);
        } else if (answers.action === 'sync-with-existing-release') {
          await deployment.syncTenantReleaseBranch(tenant, application);
        }
      }
    }

    if (answers.environment === 'production') {
      await deployment.releaseToProduction(application);
    }

    await deployment.clean.after(application);
  }

  console.log(chalk.green(`\n✔ All applications are deployed!!\n\n`));
}

deploy().then();
