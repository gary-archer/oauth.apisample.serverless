import {APIGatewayProxyResult} from 'aws-lambda';
import 'reflect-metadata';
import {CompanyService} from '../logic/services/companyService';
import {LambdaFactory} from '../middleware/lambdaFactory';
import {APIGatewayProxyExtendedEvent} from '../utilities/apiGatewayExtendedProxyEvent';
import {ResponseWriter} from '../utilities/responseWriter';

/*
 * Logic for each HTTP request uses a container per request to return a list of company resources
 */
const baseHandler = async (event: APIGatewayProxyExtendedEvent): Promise<APIGatewayProxyResult> => {

    // Resolve the service and execute the logic
    const service = event.container.get(CompanyService);
    const companies = await service.getCompanyList();

    // Write the response
    return ResponseWriter.successResponse(200, companies);
};

// Prepare the lambda handler, which is used for multiple HTTP requests, with cross cutting concerns
const factory = new LambdaFactory();
const handler = await factory.create(baseHandler);
export {handler};
