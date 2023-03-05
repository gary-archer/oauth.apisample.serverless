import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {SAMPLETYPES} from '../../logic/dependencies/sampleTypes.js';
import {SampleErrorCodes} from '../../logic/errors/sampleErrorCodes.js';
import {CompanyService} from '../../logic/services/companyService.js';
import {BaseClaims} from '../../plumbing/claims/baseClaims.js';
import {BASETYPES} from '../../plumbing/dependencies/baseTypes.js';
import {ErrorFactory} from '../../plumbing/errors/errorFactory.js';
import {ScopeVerifier} from '../../plumbing/oauth/scopeVerifier.js';
import {ResponseWriter} from '../../plumbing/utilities/responseWriter.js';
import {LambdaConfiguration} from '../startup/lambdaConfiguration.js';

/*
 * Our handler acts as a REST controller
 */
const container = new Container();
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    // First check scopes
    const baseClaims = container.get<BaseClaims>(BASETYPES.BaseClaims);
    ScopeVerifier.enforce(baseClaims.scopes, 'investments');

    // First get the supplied id and ensure it is a valid integer
    const id = parseInt(event.pathParameters?.id || '', 10);
    if (isNaN(id) || id <= 0) {

        throw ErrorFactory.createClientError(
            400,
            SampleErrorCodes.invalidCompanyId,
            'The company id must be a positive numeric integer');
    }

    // Resolve the service and execute the logic
    const service = container.get<CompanyService>(SAMPLETYPES.CompanyService);
    const companies = await service.getCompanyTransactions(id);

    // Write the response
    return ResponseWriter.objectResponse(200, companies);
};

// Create an enriched handler, which wires up middleware to run before the above handler
const configuration = new LambdaConfiguration();
const handler = configuration.enrichHandler(baseHandler, container);

// Export the handler to serverless.yml
export {handler};
