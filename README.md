# authguidance.websample.serverless1

### Overview
* This sample demonstrates Cloud Hosting for both the SPA and the API
* The API is hosted using AWS serverless API technologies
* The SPA is hosted using AWS serverless Web Content technologies

### Details
* See the Serverless Sample Overview for a summary of the solution
* See the Serverless API Setup for instructions on building a Serverless API
* See the Serverless SPA Setup for instructions on building a Serverless SPA

### Programming Languages
* TypeScript is used for the SPA
* NodeJS, TypeScript and Serverless are used for the API

### API Middleware Used
* The [OpenId-Client Library](https://github.com/panva/node-openid-client) is used to handle API token validation
* The AWS API Gateway is used as an SSL entry point to API operations
* AWS Lambda Functions are used for OAuth authorization and API logic
* CloudWatch is used to store API logs

### SPA Middleware Used
* The [Oidc-Client Library](https://github.com/IdentityModel/oidc-client-js) is used to implement the Implicit Flow
* An AWS S3 bucket is used as a Web Content Hosting Location
* AWS Cloudfront is used as a Content Delivery Network

### Common Middleware Used
* Okta is used for the Authorization Server
* AWS Route 53 is used for custom domain names
* AWS Certificate Manager is used for SSL certificate handling
