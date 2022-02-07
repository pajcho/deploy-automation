import axios from 'axios';
import { DeployConnection } from '../models/deploy-settings.model';
import { BranchData, BranchResponse } from '../models/bitbucket.model';

/**
 * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/refs/branches#post
 */
export async function listBranches(branchData: BranchData & { query: string }, credentials: DeployConnection): Promise<BranchResponse[]> {
  const client = axios.create({
    auth: { username: credentials.username, password: credentials.password },
    headers: { 'Content-Type': 'application/json' },
    baseURL: `https://api.bitbucket.org/2.0/repositories/${branchData.workspace}/${branchData.repo}`,
  });

  const data = {
    q: branchData.query,
  };

  const response = await client.get('refs/branches', { params: data }).catch((error) => {
    if (error.response) {
      switch (error.response.status) {
        case 400: {
          console.log(JSON.stringify(error));
          throw new Error('The input document was invalid, or the branch with the same name already exists.');
        }
        case 403: {
          throw new Error('The repository is private and the authenticated user does not have access to it!');
        }
        case 404: {
          throw new Error('Specified repository or branch does not exist!');
        }
        default: {
          throw new Error(`Unhandled Exception: Bitbucket responded with a status ${error.response.status}!`);
        }
      }
    }
  });

  if (response?.status === 200 && response.data.values.length) {
    return response.data.values.map((branch: Record<string, any>) => ({ name: branch.name, link: branch.links.html.href, data: branch }));
  }

  throw new Error('Could not find any remote branches based on a search criteria!');
}
