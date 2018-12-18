# authguidance.websample.serverless1

### Overview
* This sample demonstrates Cloud Hosting for both the SPA and the API
* The API is hosted using AWS serverless API technologies
* The SPA is hosted using AWS serverless Web Content technologies

### Details
* See the Serverless Sample Overview for a summary of the solution
* See the [Serverless SPA Setup](https://authguidance.com/2018/12/16/how-to-run-the-cloud-api/) for instructions on running the Single Page Application
* See the [Serverless API Setup](https://authguidance.com/2018/12/02/how-to-run-the-cloud-spa/) for instructions on running the API

### Programming Languages
* TypeScript is used for the SPA
* NodeJS, TypeScript and Serverless are used for the API

### SPA Middleware Used
* The [Oidc-Client Library](https://github.com/IdentityModel/oidc-client-js) is used to implement the Implicit Flow
* An AWS S3 bucket is used as a Web Content Hosting Location
* AWS Cloudfront is used as a Content Delivery Network

### API Middleware Used
* The [OpenId-Client Library](https://github.com/panva/node-openid-client) is used to handle API token validation
* The AWS API Gateway is used as an SSL entry point to API operations
* AWS Lambda Functions are used for API Logic and OAuth authorization
* CloudWatch is used to store API logs

### Common Middleware Used
* AWS Route 53 is used for custom domain names
* AWS Cognito is used for the Authorization Server
* AWS Certificate Manager is used for SSL certificate handling
