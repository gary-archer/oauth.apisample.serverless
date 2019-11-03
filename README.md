# authguidance.apisample.serverless

### Overview
* The final API sample using OAuth 2.0 and Open Id Connect, referenced in my blog at https://authguidance.com
* **The goals of this sample are to achieve zero maintenance cloud hosting for our API back end** 

### Details
* See the [Serverless API Setup](https://authguidance.com/2018/12/16/how-to-run-the-cloud-api/) for instructions on running the API

### Programming Languages
* NodeJS, TypeScript and Serverless are used for the API

### API Middleware Used
* The [OpenId-Client Library](https://github.com/panva/node-openid-client) is used to handle API token validation
* The AWS API Gateway is used as an SSL entry point to API operations
* AWS Lambda Functions are used for API Logic and OAuth authorization
* CloudWatch is used to store API logs
* AWS Route 53 is used for the API domain
* AWS Certificate Manager is used for the API SSL certificate
* AWS Cognito is used for the Authorization Server

