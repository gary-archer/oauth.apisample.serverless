# oauth.apisample.serverless

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/b880a7d88a7547009e950a513bc00046)](https://www.codacy.com/gh/gary-archer/oauth.apisample.serverless/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=gary-archer/oauth.apisample.serverless&amp;utm_campaign=Badge_Grade)

[![Known Vulnerabilities](https://snyk.io/test/github/gary-archer/oauth.apisample.serverless/badge.svg?targetFile=package.json)](https://snyk.io/test/github/gary-archer/oauth.apisample.serverless?targetFile=package.json)
 
### Overview

A Low Cost Serverless API sample using OAuth and Open Id Connect, referenced in my blog at https://authguidance.com:

- The API takes finer control over OAuth processing via a filter, implemented with a certified library
- The API also implements other [Non Functional Behaviour](https://authguidance.com/2017/10/08/corporate-code-sample-core-behavior/), to enable productivity and quality

### Details

* See the [Serverless API Setup](https://authguidance.com/2018/12/11/serverless-api-overview) for an overview and how to run the API
* See the [Serverless API Deployment](https://authguidance.com/2018/12/16/serverless-api-deployment/) write up for details on Cloud Hosting

### Programming Technologies

* The API operations and a custom authorizer are implemented as AWS Lambda Functions
* NodeJS and TypeScript are used as a productive coding language

### API Middleware Used

* The [JSON Web Token Library](https://github.com/auth0/node-jsonwebtoken) is used for in memory validation of JWTs
* The [JWKS RSA Library](https://github.com/auth0/node-jwks-rsa) is used for efficient download of JWT public keys
* The [OpenId-Client Library](https://github.com/panva/node-openid-client) is used for other OAuth operations
* [InversifyJS](http://inversify.io) is used to help manage class dependencies

### Cloud Infrastructure Used

* AWS Route 53 is used for custom hosting domains
* AWS Certificate Manager is used to manage and auto renew the API's SSL certificate
* AWS Cognito is used as the default Authorization Server
* The AWS API Gateway is used as the API entry point over HTTPS
* CloudWatch is used for immediate storage of API logs
* API logs are aggregated to [Elastic Cloud](https://authguidance.com/2020/08/11/cloud-elastic-search-setup) to support common [Query Use Cases](https://authguidance.com/2019/08/02/intelligent-api-platform-analysis/)
