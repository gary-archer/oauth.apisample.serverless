import {APIGatewayProxyResult} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {SAMPLETYPES} from '../../logic/dependencies/sampleTypes.js';
import {CompanyService} from '../../logic/services/companyService.js';
import {BaseClaims} from '../../plumbing/claims/baseClaims.js';
import {BASETYPES} from '../../plumbing/dependencies/baseTypes.js';
import {ScopeVerifier} from '../../plumbing/oauth/scopeVerifier.js';
import {ResponseWriter} from '../../plumbing/utilities/responseWriter.js';
import {LambdaConfiguration} from '../startup/lambdaConfiguration.js';

/*
 * The entry point is similar to a REST controller
 */
const container = new Container();
const baseHandler = async (): Promise<APIGatewayProxyResult> => {

    // First check scopes
    const baseClaims = container.get<BaseClaims>(BASETYPES.BaseClaims);
    ScopeVerifier.enforce(baseClaims.scopes, 'transactions_read');

    // Resolve the service and execute the logic
    const service = container.get<CompanyService>(SAMPLETYPES.CompanyService);
    const companies = await service.getCompanyList();

    // Write the response
    return ResponseWriter.objectResponse(200, companies);
};

// Create an enriched handler, which wires up middleware to run before the above handler
const configuration = new LambdaConfiguration();
const handler = configuration.enrichHandler(baseHandler, container);

// Export the handler to serverless.yml
export {handler};
