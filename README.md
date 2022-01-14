# Deploy automation

Set of commands to allow for easy and automated project deployments using Bitbucket APIs

# Features

#### Staging

- Create a release branch + tenant branches
  - Create a release branch from `master`
  - Create pull request and merge `development` into the release branch
  - Update release versions where necessary
- Create hotfix branch + tenant branches
  - Create a release branch from `master`
  - Update release versions where necessary
- Sync all tenant branches with the release branch
  - Check if tenant branches exist and create a branch if needed
  - Sync all tenant branches with the release branch if needed

#### Production

- Release a branch to production
  - Create pull request and merge `release` branch back to `master`
  - Tag a proper version after the merge
  - Create pull request and sync back to `development` branch immediately

# Todo

#### Functional improvements

- [ ] Better deployment settings validation
  - [ ] When something is missing ask user to fill in the details and persist in the `.deployrc.json` file
- [ ] Better branch creation
  - [ ] Detect is branch we are trying to create exists and either skip the step or recreate the branch from scratch
  - [ ] Sync branches only when needed _(When running same commands again and again, only sync branches if there are new changes, skip otherwise)_
- [ ] Better version suggestions
  - [ ] Fetch version files directly from release branch _(When creating tenant branches, instead of re-fetching version files (Netlify.toml and package.json) from master branch, fetch version from the release branch and do search and replace)_
  - [ ] When creating new release branch, try to suggest multiple versions for user to choose from instead of typing one
  - [ ] When doing the release to production or sync tenant branches try to get the latest release branches and their versions

#### Code improvements

- [x] Add linters (ESLint and Prettier)
- [x] Migrate to Typescript
  - [x] Extract models and types
  - [ ] Extract common operations into helpers
  - [ ] Group functions into classes
- [ ] Switch prompts to [Inquirer](https://github.com/SBoudrias/Inquirer.js)
- [ ] Add [Ora](https://www.npmjs.com/package/ora) to display loading states
- [ ] Write tests
