# Final Serverless API 

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/b880a7d88a7547009e950a513bc00046)](https://www.codacy.com/gh/gary-archer/oauth.apisample.serverless/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=gary-archer/oauth.apisample.serverless&amp;utm_campaign=Badge_Grade)

[![Known Vulnerabilities](https://snyk.io/test/github/gary-archer/oauth.apisample.serverless/badge.svg?targetFile=package.json)](https://snyk.io/test/github/gary-archer/oauth.apisample.serverless?targetFile=package.json)
 
## Overview

The final Serverless OAuth Secured API code sample, referenced in my blog at https://authguidance.com. \
The overall goal is to use portable security related code when working with lambdas.

- The API receives JWT access tokens from mobile and desktop apps
- The API receives `SameSite=strict` cookies from Single Page Applications
- The API validates JWTs on every request in a zero trust manner, using a JOSE library
- The API authorizes access to data using domain specific claims
- The API uses caching to avoid excessive calls to the Authorization Server
- The API implements other [Non Functional Behaviour](https://authguidance.com/2017/10/08/corporate-code-sample-core-behavior/), to enable productivity and quality

## Quick Start

Ensure that Node.js, `jq` and `curl` are installed, then run these commands to test the API's lambda functions:

- npm install
- npm run build
- npm run setup
- npm run options
- npm run getUserClaims
- npm run getCompanyList
- npm run getCompanyTransactions

## Further Information

* See the [Serverless API Setup](https://authguidance.com/2018/12/11/serverless-api-overview) for an overview
* See the [Serverless API Deployment](https://authguidance.com/2018/12/16/serverless-api-deployment/) post for details on Cloud Hosting

## Programming Technologies

* Node.js and TypeScript are used to implement AWS Lambda Functions

## API Middleware Used

* The [JOSE library](https://github.com/panva/jose) is used for to manage in memory validation of JWTs
* [InversifyJS](http://inversify.io) is used to help manage class dependencies

## Cloud Infrastructure Used

* AWS Route 53 is used for custom hosting domains
* AWS Certificate Manager is used to manage and auto renew the API's SSL certificate
* AWS Cognito is used as the default Authorization Server
* DynamoDB is used to cache JWKS keys and domain specific claims
* The AWS API Gateway is used as the HTTPS internet entry point
* CloudWatch is used for immediate storage of API logs
* API logs are aggregated to [Elastic Cloud](https://authguidance.com/2020/08/11/cloud-elastic-search-setup) to support common [Query Use Cases](https://authguidance.com/2019/08/02/intelligent-api-platform-analysis/)
