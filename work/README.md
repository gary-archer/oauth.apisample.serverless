# XAPI AWS Members

Prequisites:
*npm install

## Debugging
To invoke a function locally on a developer PC run a command similar to this:
* **sls invoke local -f get_transactions -p=..\data.json** where data.json = 
```
{
  "pathParameters": {
    "id": "14014700356996"
  },
  "queryStringParameters": {
    "transactionDateFrom": "2018-05-17T00:00:00Z",
    "transactionDateTo": "2018-09-17T00:00:00Z"
  }
}
```

To debug with breakpoints and step over code run the launch.json on VS code. 
Serverless.yml is only used in conjunction with 'Serverless' node module as a dev dependency to enable effective debugging. 

## Tests
* Unit and integration tests:  `npm test` 
* Unit tests only: `npm run unit-tests`
* Coverage report: `npm run unit-test-coverage`
The coverage report can be found under .reports/coverage-report/index.html

# Interfacing with AWS from local
For AWS-SDK calls to work from your local setup, the AWS-SDK needs credentials to access the required resources.
AWS-SDK will look for a default profile set up on your local machine and use the credentials within.
Alternatively you can set up an environment variable called AWS_PROFILE and explicitly say which profile to use when interacting with AWS

Set up a profile:
```
aws configure --profile xapi-dev
```

Set up an environment variable:
```
export AWS_PROFILE=xapi-dev
```