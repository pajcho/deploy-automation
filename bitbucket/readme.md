### TODOs

- Switch prompts to https://github.com/SBoudrias/Inquirer.js

### Create pull request

```
curl https://api.bitbucket.org/2.0/repositories/WORKSPACE/REPOSITORY/pullrequests \
  -u username:password \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{
    "title": "My Title",
    "source": {
      "branch": {
        "name": "feature/feature-title"
      }
    }
  }'
```

### Get all pull requests

```
curl https://api.bitbucket.org/2.0/repositories/WORKSPACE/REPOSITORY/pullrequests \
  -u username:password \
  --request GET \
  --header 'Content-Type: application/json'
```

### Approve pull request

```
curl https://api.bitbucket.org/2.0/repositories/WORKSPACE/REPOSITORY/pullrequests/2/approve \
  -u username:password \
  --request POST
```

### Merge pull request

```
curl https://api.bitbucket.org/2.0/repositories/WORKSPACE/REPOSITORY/pullrequests/2/merge \
  -u username:password \
  --request POST
```
