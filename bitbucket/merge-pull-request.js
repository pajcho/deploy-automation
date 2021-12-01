import chalk from 'chalk';
import axios from 'axios';

/**
 * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/pullrequests/%7Bpull_request_id%7D/merge
 */
export async function mergePullRequest(pullRequestData, credentials) {
  console.log(chalk.yellow(`› Bitbucket | Merging pull request #${pullRequestData.id}`));
  const client = axios.create({
    auth: { username: credentials.username, password: credentials.password },
    baseURL: `https://api.bitbucket.org/2.0/repositories/${pullRequestData.workspace}/${pullRequestData.repo}`,
  });

  const response = await client.post(`pullrequests/${pullRequestData.id}/merge`).catch((error) => {
    if (error.response) {
      if (error.response.status === 555) {
        console.log(
          chalk.red(
            '  › The merge took too long and timed out. In this case the caller should retry the request later!'
          )
        );
      } else {
        console.log(chalk.red(`  › Unhandled Exception: Bitbucket responded with a status ${error.response.status}!`));
      }
    }
  });

  if (response?.status === 202) {
    // TODO: handle 202 status where merging takes too long and we have to poll for changes
    //  https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/pullrequests/%7Bpull_request_id%7D/merge
  }

  if (response?.status === 200) {
    const pullRequest = { id: response.data.id, title: response.data.title, link: response.data.links.self };

    console.log(chalk.green(`  › Pull request #${pullRequestData.id} (${pullRequestData.title}) merged!`));

    return pullRequest;
  }
}
