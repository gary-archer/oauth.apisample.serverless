import {APIGatewayProxyResult} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {SAMPLETYPES} from '../../logic/dependencies/sampleTypes.js';
import {CompanyService} from '../../logic/services/companyService.js';
import {APIGatewayProxyExtendedEvent} from '../../plumbing/utilities/apiGatewayExtendedProxyEvent.js';
import {ResponseWriter} from '../../plumbing/utilities/responseWriter.js';
import {LambdaConfiguration} from '../startup/lambdaConfiguration.js';

/*
 * A lambda to return a list of company resources
 */
const parentContainer = new Container();
const baseHandler = async (event: APIGatewayProxyExtendedEvent): Promise<APIGatewayProxyResult> => {

    // Resolve the service and execute the logic
    const service = event.container.get<CompanyService>(SAMPLETYPES.CompanyService);
    const companies = await service.getCompanyList();

    // Write the response
    return ResponseWriter.successResponse(200, companies);
};

// Create an enriched handler, which wires up middleware to run before the above handler
const configuration = new LambdaConfiguration();
const handler = await configuration.enrichHandler(baseHandler, parentContainer);

// Export the handler to serverless.yml
export {handler};
