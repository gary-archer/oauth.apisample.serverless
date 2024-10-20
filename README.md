# Final Serverless API 

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/4693359edb364b419ec889b920da08b3)](https://app.codacy.com/gh/gary-archer/oauth.apisample.serverless?utm_source=github.com&utm_medium=referral&utm_content=gary-archer/oauth.apisample.serverless&utm_campaign=Badge_Grade)

[![Known Vulnerabilities](https://snyk.io/test/github/gary-archer/oauth.apisample.serverless/badge.svg?targetFile=package.json)](https://snyk.io/test/github/gary-archer/oauth.apisample.serverless?targetFile=package.json)
 
The Serverless OAuth secured Node.js API code sample:

- The API takes finer control over OAuth claims-based authorization to enable security with good manageability.
- The API uses JSON request logging and log aggregation, for the best supportability.

## API Serves Frontend Clients

The AWS deployed API runs as part of an OAuth end-to-end setup, to serve my blog's frontend code samples.\
This enables productive frontend developemnt against remote cloud endpoints:

- [Final Single Page Application](https://github.com/gary-archer/oauth.websample.final)
- [Final Desktop App](https://github.com/gary-archer/oauth.desktopsample.final)
- [Final iOS App](https://github.com/gary-archer/oauth.mobilesample.ios)
- [Final Android App](https://github.com/gary-archer/oauth.mobilesample.android)

## API Security is Testable

The API's clients are UIs, which get user-level access tokens by running an OpenID Connect code flow.\
To enable test-driven development, the API instead mocks the authorization server:

![Local Lambda Tests](./doc/local-lambda-tests.png)

## How to Run the API

- Ensure that Node.js 20 or later is installed
- Integration tests run Wiremock in Docker, so ensure that Docker is installed

Run this command to build code and then run mocha tests that invoke all lambdas:

```bash
./start.sh
```

This works well enough to meet my low cost deployment goals, though these technical limitations exist:

- The lambdas cannot be run as real HTTP endpoints locally, and be called concurrently by clients.
- The lambdas cannot be load tested locally, due to the slow lambda startup times.
- The lambdas cannot use in-memory caching of token signing public keys or extra claims.

## Further Information

* See the [API Journey - Server Side](https://github.com/gary-archer/oauth.blog/tree/master/public/posts/api-journey-server-side.mdx) for further information on the API's desired behaviour.
* See the [Serverless API Overview](https://github.com/gary-archer/oauth.blog/tree/master/public/posts/serverless-api-overview.mdx) for further details on the API development and deployment details.

## Programming Languages

* The API uses Node.js and TypeScript.

## Infrastructure

* The [jose](https://github.com/panva/jose) library manages in-memory JWT validation.
* AWS Route 53 provides custom hosting domains.
* AWS Certificate Manager issues and auto-renews the API's SSL certificate.
* AWS Cognito is the API's default Authorization Server.
* DynamoDB caches JWKS keys and extra claims.
* The AWS API Gateway is the internet API entry point.
* The API logs output to CloudWatch and could be shipped to a log aggregation system.
