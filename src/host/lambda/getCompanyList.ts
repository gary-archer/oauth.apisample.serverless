import {APIGatewayProxyResult} from 'aws-lambda';
import 'reflect-metadata';
import {APPLICATIONTYPES} from '../../logic/dependencies/applicationTypes.js';
import {CompanyService} from '../../logic/services/companyService.js';
import {APIGatewayProxyExtendedEvent} from '../../plumbing/utilities/apiGatewayExtendedProxyEvent.js';
import {ResponseWriter} from '../../plumbing/utilities/responseWriter.js';
import {LambdaInstance} from '../startup/lambdaInstance.js';

/*
 * Logic for each HTTP request uses a container per request to return a list of company resources
 */
const baseHandler = async (event: APIGatewayProxyExtendedEvent): Promise<APIGatewayProxyResult> => {

    // Resolve the service and execute the logic
    const service = event.container.get<CompanyService>(APPLICATIONTYPES.CompanyService);
    const companies = await service.getCompanyList();

    // Write the response
    return ResponseWriter.successResponse(200, companies);
};

// Prepare the lambda instance, which is used for multiple HTTP requests, with cross cutting concerns
const instance = new LambdaInstance();
const handler = await instance.prepare(baseHandler);
export {handler};
