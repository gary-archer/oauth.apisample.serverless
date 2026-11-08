# Final Serverless API 

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/4693359edb364b419ec889b920da08b3)](https://app.codacy.com/gh/gary-archer/oauth.apisample.serverless?utm_source=github.com&utm_medium=referral&utm_content=gary-archer/oauth.apisample.serverless&utm_campaign=Badge_Grade)

[![Known Vulnerabilities](https://snyk.io/test/github/gary-archer/oauth.apisample.serverless/badge.svg?targetFile=package.json)](https://snyk.io/test/github/gary-archer/oauth.apisample.serverless?targetFile=package.json)
 
The Serverless OAuth secured Node.js API code sample:

- The API users a zero trust approach and does its own JWT access token validation.
- The API takes control over OAuth claims-based authorization to enable security with good manageability.
- The API uses JSON request logging and can use log aggregation, for the best supportability.

## API Serves Frontend Clients

The API can run as part of an OAuth end-to-end setup, to serve my blog's UI code samples.\
Running the API in this manner forces it to be consumer-focused to its clients:

![SPA and API](./images/spa-and-api.jpg)

The AWS deployed API is the default API that the blog's final frontend code samples connect to:

- [Final Single Page Application](https://github.com/gary-archer/oauth.websample.final)
- [Final Desktop App](https://github.com/gary-archer/oauth.desktopsample.final)
- [Final iOS App](https://github.com/gary-archer/oauth.mobilesample.ios)
- [Final Android App](https://github.com/gary-archer/oauth.mobilesample.android)

## API Security is Testable

The API's clients are UIs, which get user-level access tokens by running an OpenID Connect code flow.\
To enable test-driven development, the API instead mocks the authorization server:

![Local Lambda Tests](./images/tests.png)

A basic load test fires batches of concurrent requests at the API.\
This further verifies reliability and the correctness of API logs.

![Load Test](./images/loadtest.png)

### API is Supportable

You can aggregate request logs and audit logs to Elasticsearch and run [Technical Support Queries](https://github.com/gary-archer/oauth.blog/tree/master/public/posts/api-technical-support-analysis.mdx).

![Support Queries](./images/support-queries.jpg)

## Local Development Quick Start

The API uses [Real World OAuth Development URLs](https://github.com/gary-archer/oauth.blog/blob/master/public/posts/developer-ssl-setup.mdx#real-world-oauth-development-urls) on a local computer.  
You must use admin permissions to configure infrastructure before you run the code.  

### Infrastructure Setup

Add DNS entries to your `/etc/hosts` file:

```bash
127.0.0.1 localhost api.authsamples-dev.com login.authsamples-dev.com
```

Make sure OpenSSL 3+ is installed, specify a secrets folder, then create development certificates:

```bash
export SECRETS_FOLDER="$HOME/secrets"
mkdir -p "$SECRETS_FOLDER"
./certs/create.sh
```

Ensure that Node.js 26+ is installed, then grant it access to listen on port 443:

```bash
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

### Run the Code

Then run the API, which does not require admin permissions:

```bash
./start.sh
```

### Test the API

Stop the API, then re-run it with a test configuration:

```bash
./testsetup.sh
```

Then run integration tests and a load test:

```bash
./integration_tests.sh
./load_test.sh
```

## Further Information

* See the [API Journey - Server Side](https://github.com/gary-archer/oauth.blog/tree/master/public/posts/api-journey-server-side.mdx) for further information on the API's desired behaviour.
* See the [Serverless API Overview](https://github.com/gary-archer/oauth.blog/tree/master/public/posts/serverless-api-overview.mdx) for further details on the API development and deployment details.

## Programming Languages

* The API uses Node.js, TypeScript and the Serverless framework.

## Infrastructure

* The [jose](https://github.com/panva/jose) library manages in-memory JWT validation.
* AWS Route 53 provides custom hosting domains.
* AWS Certificate Manager issues and auto-renews the API's SSL certificate.
* AWS Cognito is the API's default authorization server.
* The AWS API Gateway provides the internet API entry point.
* The API outputs logs to CloudWatch and they could be shipped to a log aggregation system.
