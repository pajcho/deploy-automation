import chalk from 'chalk';
import axios from 'axios';
import { DeployConnection } from '../models/deploy-settings.model';
import { BranchData, BranchResponse } from '../models/bitbucket.model';

/**
 * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/refs/branches#post
 */
export async function createBranch(branchData: BranchData, credentials: DeployConnection): Promise<BranchResponse | false> {
  console.log(chalk.yellow('› Bitbucket | Creating branch...'));
  const client = axios.create({
    auth: { username: credentials.username, password: credentials.password },
    headers: { 'Content-Type': 'application/json' },
    baseURL: `https://api.bitbucket.org/2.0/repositories/${branchData.workspace}/${branchData.repo}`,
  });

  const data = {
    name: branchData.name,
    target: { hash: branchData.source },
  };

  const response = await client.post('refs/branches', data).catch((error) => {
    if (error.response) {
      switch (error.response.status) {
        case 400: {
          console.log(chalk.red('  › The input document was invalid, or the branch with the same name already exists.'));

          break;
        }
        case 403: {
          console.log(chalk.red('  › The repository is private and the authenticated user does not have access to it!'));

          break;
        }
        case 404: {
          console.log(chalk.red('  › Specified repository or branch does not exist!'));

          break;
        }
        default: {
          console.log(chalk.red(`  › Unhandled Exception: Bitbucket responded with a status ${error.response.status}!`));
        }
      }
    }
  });

  if (response?.status === 201) {
    const branch = { name: response.data.name, link: response.data.links.html.href, data: response.data };

    console.log(chalk.green(`  › Branch ${branch.name} created from ${branchData.source}!`));
    console.log(chalk.dim(`  › ${branch.link}`));

    return branch;
  }

  return false;
}
