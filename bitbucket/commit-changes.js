import chalk from 'chalk';
import axios from 'axios';
import FormData from 'form-data';

/**
 * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/src#post
 */
export async function commitChanges(commitData, credentials) {
  console.log(chalk.yellow('› Bitbucket | Preparing a commit...'));
  console.log(chalk.dim(`  › Trying to commit "${commitData.message}" on branch ${commitData.target}`));

  const form = new FormData();

  commitData.files.forEach((file) => {
    form.append(file.path, file.contents, file.path);
  });

  form.append('message', commitData.message);
  form.append('branch', commitData.target);

  const client = axios.create({
    auth: { username: credentials.username, password: credentials.password },
    headers: { ...form.getHeaders() },
    baseURL: `https://api.bitbucket.org/2.0/repositories/${commitData.workspace}/${commitData.repo}`,
  });

  const response = await client.post(`src`, form).catch((error) => {
    if (error.response) {
      if (error.response.status === 403) {
        console.log(chalk.red('  › The repository is private and the authenticated user does not have access to it!'));
      } else if (error.response.status === 404) {
        console.log(chalk.red('  › Specified repository does not exist!'));
      } else {
        console.log(chalk.red(`  › Unhandled Exception: Bitbucket responded with a status ${error.response.status}!`));
      }
    }
  });

  if (response?.status === 201) {
    console.log(chalk.green(`  › Changes committed!`));

    return response.data;
  }
}
