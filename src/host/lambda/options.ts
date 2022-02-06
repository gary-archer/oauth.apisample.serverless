import {APIGatewayProxyResult} from 'aws-lambda';
import 'reflect-metadata';
import {LambdaConfiguration} from '../startup/lambdaConfiguration';

/*
 * Return an empty result, and a CORS middleware object will append response headers needed by the SPA
 */
const baseHandler = async (): Promise<APIGatewayProxyResult> => {
    return { statusCode: 200 } as APIGatewayProxyResult;
};

// Create an enriched handler, which wires up CORS middleware to run after the above handler
const configuration = new LambdaConfiguration();
const handler = configuration.enrichOptionsHandler(baseHandler);

// Export the handler to serverless.yml
export {handler};
