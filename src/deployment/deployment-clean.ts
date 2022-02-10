import { doTheCleanup } from '../deploy/do-the-cleanup';
import { Deployment } from './deployment';

export class DeploymentClean {
  // Used while testing to quickly reset the repository state after changes
  shouldCleanBefore = false;
  shouldCleanAfter = false;

  constructor(private deployment: Deployment) {}

  private cleanup(application: string) {
    return doTheCleanup(this.deployment.answers, application, this.deployment.settings);
  }

  async before(application: string) {
    if (this.shouldCleanBefore) await this.cleanup(application);
  }

  async after(application: string) {
    if (this.shouldCleanAfter) await this.cleanup(application);
  }
}
