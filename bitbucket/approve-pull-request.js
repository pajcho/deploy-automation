import chalk from 'chalk';
import axios from 'axios';

/**
 * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/pullrequests/%7Bpull_request_id%7D/approve#post
 */
export async function approvePullRequest(pullRequestData, credentials) {
  console.log(chalk.yellow(`› Bitbucket | Approving pull request #${pullRequestData.id}`));
  const client = axios.create({
    auth: { username: credentials.username, password: credentials.password },
    baseURL: `https://api.bitbucket.org/2.0/repositories/${pullRequestData.workspace}/${pullRequestData.repo}`,
  });

  const response = await client.post(`pullrequests/${pullRequestData.id}/approve`).catch((error) => {
    if (error.response) {
      if (error.response.status === 401) {
        console.log(chalk.red('  › The request was not authenticated. Make sure you have the right privileges set!'));
      } else if (error.response.status === 404) {
        console.log(chalk.red('  › Specified repository does not exist!'));
      } else {
        console.log(chalk.red(`  › Unhandled Exception: Bitbucket responded with a status ${error.response.status}!`));
      }
    }
  });

  if (response?.status === 200) {
    console.log(chalk.green(`  › Pull request #${pullRequestData.id} (${pullRequestData.title}) approved!`));

    return pullRequestData.id;
  }
}
