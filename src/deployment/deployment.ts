import { createReleaseBranch } from '../deploy/create-release-branch';
import { createTenantReleaseBranch } from '../deploy/create-tenant-release-branch';
import { mergeDevelopmentIntoRelease } from '../deploy/merge-development-into-release';
import { releaseToProduction } from '../deploy/release-to-production';
import { syncTenantReleaseBranch } from '../deploy/sync-tenant-release-branch';
import { DeploySettings } from '../models/deploy-settings.model';
import { DeploymentClean } from './deployment-clean';

export class Deployment {
  clean: DeploymentClean;

  constructor(public settings: DeploySettings, public answers: any) {
    this.clean = new DeploymentClean(this);
  }

  createReleaseBranch(application: string) {
    return createReleaseBranch(this.answers, application, this.settings);
  }

  mergeDevelopmentIntoRelease(application: string) {
    return mergeDevelopmentIntoRelease(this.answers, application, this.settings);
  }

  createTenantReleaseBranch(tenant: string, application: string) {
    return createTenantReleaseBranch(tenant, this.answers, application, this.settings);
  }

  syncTenantReleaseBranch(tenant: string, application: string) {
    return syncTenantReleaseBranch(tenant, this.answers, application, this.settings);
  }

  releaseToProduction(application: string) {
    return releaseToProduction(this.answers, application, this.settings);
  }
}
