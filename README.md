# Final Serverless API 

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/4693359edb364b419ec889b920da08b3)](https://app.codacy.com/gh/gary-archer/oauth.apisample.serverless?utm_source=github.com&utm_medium=referral&utm_content=gary-archer/oauth.apisample.serverless&utm_campaign=Badge_Grade)

[![Known Vulnerabilities](https://snyk.io/test/github/gary-archer/oauth.apisample.serverless/badge.svg?targetFile=package.json)](https://snyk.io/test/github/gary-archer/oauth.apisample.serverless?targetFile=package.json)
 
## Overview

The Serverless OAuth secured Node.js API code sample, referenced in my blog at https://authguidance.com:

- The API has a fictional business area of `investments`, but simply returns hard coded data
- The API's lambda functions validate a JWT access token on every request, in a zero trust manner
- The API takes finer control over OAuth and claims to enable the best security with good manageability
- The API uses JSON request logging and Elasticsearch log aggregation, for measurability

## API serves UI Clients

The AWS deployed API runs as part of an OAuth end-to-end setup, to serve my blog's UI code samples.\
This enables UI code examples to point to API endpoints that run in the AWS cloud:

- [Final Single Page Application](https://github.com/gary-archer/oauth.websample.final)
- [Final Desktop App](https://github.com/gary-archer/oauth.desktopsample.final)
- [Final iOS App](https://github.com/gary-archer/oauth.mobilesample.ios)
- [Final Android App](https://github.com/gary-archer/oauth.mobilesample.android)

## Prerequisites

- Ensure that Node.js 20 or later is installed
- Integration tests use Wiremock, so also install a Java 17+ SDK

## Local Development Quick Start

Run this command to build code and then run mocha tests that invoke all lambdas:

```bash
./start.sh
```

The API's clients are UIs, which get user level access tokens by running an OpenID Connect code flow.\
For productive test driven development, the API instead mocks the Authorization Server.\
This enables the API component to be developed and tested in isolation:

![Local Lambda Tests](./doc/local-lambda-tests.png)

This works well enough to meet my low cost deployment goals, though these technical limitations exist:

- The lambdas cannot be run as real HTTP endpoints locally, and be called concurrently from UIs
- The lambdas cannot be load tested locally, due to the slow lambda startup times
- The lambdas cannot use in-memory caching of token signing public keys or extra claims

## Further Information

* See the [API Journey - Server Side](https://authguidance.com/api-journey-server-side/) for further information on the desired API behaviour
* See the [Serverless API Overview](https://authguidance.com/serverless-api-overview) for further details on how the API runs locally
* See the [Serverless API Deployment](https://authguidance.com/serverless-api-deployment/) post for details on how the API is deployed to the AWS cloud

## Programming Technologies

* Node.js and TypeScript are used to implement AWS Lambda Functions

## Infrastructure

* The [jose](https://github.com/panva/jose) library is used to manage in memory validation of JWTs
* AWS Route 53 is used for custom hosting domains
* AWS Certificate Manager is used to manage and auto renew the API's SSL certificate
* AWS Cognito is used as the default Authorization Server
* DynamoDB is used to cache JWKS keys and domain specific claims
* The AWS API Gateway is used as the HTTPS internet entry point
* CloudWatch is used for immediate storage of API logs, which could then be aggregated, eg to Elasticsearch.
