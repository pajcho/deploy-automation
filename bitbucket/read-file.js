import chalk from 'chalk';
import axios from 'axios';

/**
 * https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/src#get
 *
 * TODO: Reading files from branches with slashes in the name (ie. release/13.10.0) wont work
 *  and we have to use last commit hash as a fileData.source (ie. ad1d989c025d0dcd774834964b62374337c23304)
 */
export async function readFile(fileData, credentials, log = true) {
  log && console.log(chalk.yellow('› Bitbucket | Reading file...'));
  log && console.log(chalk.dim(`  › Reading file contents: ${fileData.source}/${fileData.path}`));
  const client = axios.create({
    auth: { username: credentials.username, password: credentials.password },
    baseURL: `https://api.bitbucket.org/2.0/repositories/${fileData.workspace}/${fileData.repo}`,
  });

  const response = await client.get(`src/${fileData.source}/${fileData.path}`).catch((error) => {
    if (log && error.response) {
      if (error.response.status === 400) {
        console.log(chalk.red('  › The input document was invalid, or the branch with the same name already exists.'));
      } else if (error.response.status === 403) {
        console.log(chalk.red('  › The repository is private and the authenticated user does not have access to it!'));
      } else if (error.response.status === 404) {
        console.log(chalk.red('  › Specified file does not exist!'));
      } else {
        console.log(chalk.red(`  › Unhandled Exception: Bitbucket responded with a status ${error.response.status}!`));
      }
    }
  });

  if (response?.status === 200) {
    return response.data;
  }
}
