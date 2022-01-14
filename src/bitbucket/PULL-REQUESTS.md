https://stackoverflow.com/questions/8721730/bitbucket-send-a-pull-request-via-command-line

## Get details about Pull Request

```
curl --user username:password \
  https://bitbucket.org/api/2.0/repositories/WORKSPACE/REPOSITORY/pullrequests/1
```

## Create Pull Request

https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Bworkspace%7D/%7Brepo_slug%7D/pullrequests#post

```
curl https://api.bitbucket.org/2.0/repositories/WORKSPACE/REPOSITORY/pullrequests \
    -u username:password \
    --request POST \
    --header 'Content-Type: application/json' \
    --data '{
        "title": "My Title",
        "description": "",
        "source": {
            "branch": {
                "name": "my-feature-branch"
            }
        },
        "destination": {
            "branch": {
                "name": "staging"
            }
        },
        "close_source_branch": false
    }'
```

### Response

We will have to get ID from the response in order to auto merge and close the PR

```json
{
  "id": 1,
  "comment_count": 0,
  "state": "OPEN",
  "task_count": 0,
  "participants": [],
  "reason": "",
  "updated_on": "2021-10-11T09:21:07.579368+00:00",
  "rendered": {},
  "type": "pullrequest",
  "description": "",
  "links": {},
  "title": "My Title",
  "close_source_branch": false,
  "reviewers": [],
  "destination": {},
  "created_on": "2021-10-11T09:21:06.963550+00:00",
  "summary": {},
  "source": {},
  "author": {},
  "merge_commit": null,
  "closed_by": null
}
```

#### Useful old API docs with better examples

http://web.archive.org/web/20150530151816/https://confluence.atlassian.com/display/BITBUCKET/pullrequests+Resource#pullrequestsResource-POST(create)anewpullrequest
