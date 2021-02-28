import {Container} from 'inversify';
import 'reflect-metadata';
import {SAMPLETYPES} from '../../logic/dependencies/sampleTypes';
import {SampleErrorCodes} from '../../logic/errors/sampleErrorCodes';
import {CompanyService} from '../../logic/services/companyService';
import {BASETYPES, ErrorFactory, ResponseWriter} from '../../plumbing-base';
import {SampleApiClaims} from '../claims/sampleApiClaims';
import {LambdaConfiguration} from './startup/lambdaConfiguration';

/*
 * Our handler acts as a REST controller
 */
const container = new Container();
const baseHandler = async (event: any) => {

    // First get the supplied id and ensure it is a valid integer
    const id = parseInt(event.pathParameters.id, 10);
    if (isNaN(id) || id <= 0) {

        throw ErrorFactory.createClientError(
            400,
            SampleErrorCodes.invalidCompanyId,
            'The company id must be a positive numeric integer');
    }

    // Get claims produced by the authorizer
    const claims = container.get<SampleApiClaims>(BASETYPES.CoreApiClaims);

    // Execute the logic
    const service = container.get<CompanyService>(SAMPLETYPES.CompanyService);
    const companies = await service.getCompanyTransactions(id, claims.isAdmin, claims.regionsCovered);

    // Write the response
    return ResponseWriter.objectResponse(200, companies);
};

// Create an enriched handler, which wires up middleware to run before the above handler
const configuration = new LambdaConfiguration(container);
const handler = configuration.enrichHandler(baseHandler);

// Export the handler to serverless.yml
export {handler};
