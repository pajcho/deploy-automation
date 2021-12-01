import chalk from 'chalk';
import axios from 'axios';

/**
 * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/pullrequests#post
 */
export async function createPullRequest(pullRequestData, credentials) {
  console.log(
    chalk.yellow(`› Bitbucket | Creating pull request ${pullRequestData.source} → ${pullRequestData.destination}`)
  );
  const client = axios.create({
    auth: { username: credentials.username, password: credentials.password },
    headers: { 'Content-Type': 'application/json' },
    baseURL: `https://api.bitbucket.org/2.0/repositories/${pullRequestData.workspace}/${pullRequestData.repo}`,
  });

  const data = {
    title: pullRequestData.title,
    source: { branch: { name: pullRequestData.source } },
    destination: { branch: { name: pullRequestData.destination } },
    close_source_branch: false,
  };

  const response = await client.post('pullrequests', data).catch((error) => {
    if (error.response) {
      if (error.response.status === 400) {
        console.log(
          chalk.red(
            '  › The input document was invalid, or if the caller lacks the privilege to create repositories under the targeted account.'
          )
        );
      } else if (error.response.status === 401) {
        console.log(chalk.red('  › The request was not authenticated. Make sure you have the right privileges set!'));
      } else if (error.response.status === 404) {
        console.log(chalk.red('  › Specified repository does not exist!'));
      } else {
        console.log(chalk.red(`  › Unhandled Exception: Bitbucket responded with a status ${error.response.status}!`));
      }
    }
  });

  if (response?.status === 201) {
    const pullRequest = { id: response.data.id, title: response.data.title, link: response.data.links.html.href };
  
    console.log(chalk.green(`  › Pull request #${pullRequest.id} (${pullRequest.title}) created!`));
    console.log(chalk.dim(`  › ${pullRequest.link}`));
    return pullRequest;
  }
}
