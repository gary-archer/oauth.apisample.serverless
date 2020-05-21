import {Context} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {LOGICTYPES} from '../../logic/configuration/logicTypes';
import {ErrorCodes} from '../../logic/errors/errorCodes';
import {CompanyService} from '../../logic/services/companyService';
import {APIFRAMEWORKTYPES, ErrorFactory, ResponseWriter} from '../../plumbing-base';
import {SampleApiClaims} from '../claims/sampleApiClaims';
import {HandlerFactory} from './handlerFactory';

const container = new Container();

/*
 * Our handler acts as a REST controller
 */
const baseHandler = async (event: any, context: Context) => {

    // First get the supplied id and ensure it is a valid integer
    const id = parseInt(event.pathParameters.id, 10);
    if (isNaN(id) || id <= 0) {

        throw ErrorFactory.createClientError(
            400,
            ErrorCodes.invalidCompanyId,
            'The company id must be a positive numeric integer');
    }

    // Get claims produced by the authorizer
    const claims = container.get<SampleApiClaims>(APIFRAMEWORKTYPES.CoreApiClaims);

    // Execute the logic
    const service = container.get<CompanyService>(LOGICTYPES.CompanyService);
    const companies = await service.getCompanyTransactions(id, claims.regionsCovered);

    // Write the response
    return ResponseWriter.objectResponse(200, companies);
};

// Create an enriched handler, which wires up framework handling to run before the above handler
const factory = new HandlerFactory(container);
const handler = factory.enrichHandler(baseHandler);

// Export the handler to serverless.yml
export {handler};
