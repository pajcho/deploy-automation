import chalk from 'chalk';
import { validateDeploySettings } from './settings/validate-deploy-settings';
import { askDeploymentQuestions } from './deploy/ask-deployment-questions';
import { doTheCleanup } from './deploy/do-the-cleanup';
import { mergeDevelopmentIntoRelease } from './deploy/merge-development-into-release';
import { syncTenantReleaseBranch } from './deploy/sync-tenant-release-branch';
import { createTenantReleaseBranch } from './deploy/create-tenant-release-branch';
import { releaseToProduction } from './deploy/release-to-production';
import { createReleaseBranch } from './deploy/create-release-branch';

async function deploy() {
  const settings = await validateDeploySettings();
  const answers = await askDeploymentQuestions(settings);

  if (!answers.ready) return;

  // Used while testing to quickly reset the repository state after changes
  const doTheCleanupBefore = false;
  const doTheCleanupAfter = false;

  for (const application of answers.applications) {
    if (doTheCleanupBefore) await doTheCleanup(answers, application, settings);

    if (answers.environment === 'staging') {
      if (['new-release-branch', 'new-hotfix-branch'].includes(answers.action)) {
        await createReleaseBranch(answers, application, settings);

        // If we are creating a new release branch we need to pull in the latest changes from development
        if (answers.action === 'new-release-branch') {
          await mergeDevelopmentIntoRelease(answers, application, settings);
        }
      }

      for (const tenant of answers.tenants || []) {
        if (['new-release-branch', 'new-hotfix-branch'].includes(answers.action)) {
          await createTenantReleaseBranch(tenant, answers, application, settings);
        } else if (answers.action === 'sync-with-existing-release') {
          await syncTenantReleaseBranch(tenant, answers, application, settings);
        }
      }
    }

    if (answers.environment === 'production') {
      await releaseToProduction(answers, application, settings);
    }

    if (doTheCleanupAfter) await doTheCleanup(answers, application, settings);
  }

  console.log(chalk.green(`\n✔ All applications are deployed!!\n\n`));
}

deploy().then();
