import {Context} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {ApiClaims, FRAMEWORKTYPES, ResponseHandler} from '../../framework-api-base';
import {LOGICTYPES} from '../../logic/configuration/logicTypes';
import {CompanyService} from '../../logic/services/companyService';
import {CompositionRoot} from '../configuration/compositionRoot';
import {HandlerFactory} from './handlerFactory';

// Create the container
const container = new Container();

/*
 * Our handler acts as a REST controller
 */
const baseHandler = async (event: any, context: Context) => {

    // Register dependencies
    CompositionRoot.registerDependencies(container);

    // Get claims produced by the authorizer
    const claims = container.get<ApiClaims>(FRAMEWORKTYPES.ApiClaims);

    // Execute the logic
    const service = container.get<CompanyService>(LOGICTYPES.CompanyService);
    const companies = await service.getCompanyList(claims.regionsCovered);

    // Write the response
    return ResponseHandler.objectResponse(200, companies);
};

// Create an enriched handler, which wires framework handling to run before the above handler
// The framework also ensures logging and error handling
const factory = new HandlerFactory(container);
const handler = factory.createLambdaHandler(baseHandler);

// Export the handler to serverless.yml
export {handler};
