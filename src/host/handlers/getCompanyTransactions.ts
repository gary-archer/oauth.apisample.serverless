import {Context} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {ApiClaims, ClientError, FRAMEWORKTYPES, ResponseHandler} from '../../framework-api-base';
import {LOGICTYPES} from '../../logic/configuration/logicTypes';
import {CompanyService} from '../../logic/services/companyService';
import {HandlerFactory} from './handlerFactory';

// Create the container
const container = new Container();

/*
 * Our handler acts as a REST controller
 */
const baseHandler = async (event: any, context: Context) => {

    // First get the supplied id and ensure it is a valid integer
    const id = parseInt(event.pathParameters.id, 10);
    if (isNaN(id) || id <= 0) {

        throw new ClientError(
            400,
            'invalid_company_id',
            'The company id must be a positive numeric integer');
    }

    // Get claims produced by the authorizer
    const claims = container.get<ApiClaims>(FRAMEWORKTYPES.ApiClaims);

    // Execute the logic
    const service = container.get<CompanyService>(LOGICTYPES.CompanyService);
    const companies = await service.getCompanyTransactions(id, claims.regionsCovered);

    // Write the response
    return ResponseHandler.objectResponse(200, companies);
};

// Create an enriched handler, which wires up framework handling to run before the above handler
const factory = new HandlerFactory(container);
const handler = factory.createLambdaHandler(baseHandler);

// Export the handler to serverless.yml
export {handler};
