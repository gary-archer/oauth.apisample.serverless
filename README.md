# authguidance.websample.serverless1

### Overview
* This sample demonstrates Cloud Hosting for both the SPA and the API
* The API is hosted using AWS serverless API technologies
* The SPA is hosted using AWS serverless Web Content technologies

### Details
* See the Serverless Sample Overview for a summary of the solution
* See the Serverless Sample Instructions for instructions on running your own version

### Programming Languages
* TypeScript is used for the SPA
* NodeJS, TypeScript and Serverless are used for the API

### SPA Middleware Used
* The [Oidc-Client Library](https://github.com/IdentityModel/oidc-client-js) is used to implement the Implicit Flow
* An AWS S3 bucket is used as a web content deployment location
* AWS Cloudfront is used as a Content Delivery Network

### API Middleware Used
* The [OpenId-Client Library](https://github.com/panva/node-openid-client) is used to handle API token validation
* The AWS API Gateway is used as an SSL entry point to API operations
* AWS Lambda functions are used for serverless cloud hosting
* CloudWatch is used to store API logs

### Common Middleware Used
* Okta is used for the Authorization Server
* AWS Certificate Manager is used for SSL certificate handling
