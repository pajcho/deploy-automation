import chalk from 'chalk';
import axios from 'axios';
import { TagData, TagResponse } from '../models/bitbucket.model';
import { DeployConnection } from '../models/deploy-settings.model';

/**
 * https://developer.atlassian.com/cloud/bitbucket/rest/api-group-refs/#api-repositories-workspace-repo-slug-refs-tags-post
 */
export async function createTag(tagData: TagData, credentials: DeployConnection): Promise<TagResponse | false> {
  console.log(chalk.yellow('› Bitbucket | Creating tag...'));
  const client = axios.create({
    auth: { username: credentials.username, password: credentials.password },
    headers: { 'Content-Type': 'application/json' },
    baseURL: `https://api.bitbucket.org/2.0/repositories/${tagData.workspace}/${tagData.repo}`,
  });

  const data = {
    name: tagData.name,
    target: { hash: tagData.hash },
  };

  const response = await client.post('refs/tags', data).catch((error) => {
    if (error.response) {
      switch (error.response.status) {
        case 400: {
          console.log(chalk.red('  › The input document was invalid, or the tag with the same name already exists.'));

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
    const tag = { name: response.data.name, link: response.data.links.html.href, data: response.data };

    console.log(chalk.green(`  › Tag ${tag.name} created on ${tagData.hash}!`));
    console.log(chalk.dim(`  › ${tag.link}`));

    return tag;
  }

  return false;
}
