import {Context} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {ApiClaims, FRAMEWORKTYPES, ResponseHandler} from '../../framework-api-base';
import {HandlerFactory} from './handlerFactory';

// Create the container
const container = new Container();

/*
 * Our handler acts as a REST controller
 */
const baseHandler = async (event: any, context: Context) => {

    // Get claims produced by the authorizer
    const claims = container.get<ApiClaims>(FRAMEWORKTYPES.ApiClaims);

    // Return user info in the response
    return ResponseHandler.objectResponse(200, claims.userInfo);
};

// Create an enriched handler, which wires up framework handling to run before the above handler
const factory = new HandlerFactory(container);
const handler = factory.createLambdaHandler(baseHandler);

// Export the handler to serverless.yml
export {handler};
