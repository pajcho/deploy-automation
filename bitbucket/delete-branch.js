import chalk from 'chalk';
import axios from 'axios';

/**
 * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/refs/branches/%7Bname%7D
 */
export async function deleteBranch(branchData, credentials) {
  console.log(chalk.yellow('› Bitbucket | Deleting branch...'));
  const client = axios.create({
    auth: { username: credentials.username, password: credentials.password },
    headers: { 'Content-Type': 'application/json' },
    baseURL: `https://api.bitbucket.org/2.0/repositories/${branchData.workspace}/${branchData.repo}`,
  });

  const response = await client.delete('refs/branches/' + branchData.name).catch((error) => {
    if (error.response) {
      if (error.response.status === 403) {
        console.log(chalk.red('  › The repository is private and the authenticated user does not have access to it!'));
      } else if (error.response.status === 404) {
        console.log(chalk.red('  › Specified repository or branch does not exist!'));
      } else {
        console.log(chalk.red(`  › Unhandled Exception: Bitbucket responded with a status ${error.response.status}!`));
      }
    }
  });

  if (response?.status === 204) {
    console.log(chalk.green(`  › Branch ${branchData.name} deleted!`));

    return branchData;
  }
}
