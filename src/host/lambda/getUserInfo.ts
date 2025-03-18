import {APIGatewayProxyResult} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {SampleExtraClaims} from '../../logic/claims/sampleExtraClaims.js';
import {ClaimsPrincipal} from '../../plumbing/claims/claimsPrincipal.js';
import {BASETYPES} from '../../plumbing/dependencies/baseTypes.js';
import {APIGatewayProxyExtendedEvent} from '../../plumbing/utilities/apiGatewayExtendedProxyEvent.js';
import {ResponseWriter} from '../../plumbing/utilities/responseWriter.js';
import {LambdaConfiguration} from '../startup/lambdaConfiguration.js';

/*
 * A lambda to return user info not stored in the authorization server
 */
const parentContainer = new Container();
const baseHandler = async (event: APIGatewayProxyExtendedEvent): Promise<APIGatewayProxyResult> => {

    const claims = event.container.get<ClaimsPrincipal>(BASETYPES.ClaimsPrincipal);
    const extraClaims = claims.extra as SampleExtraClaims;
    const userInfo = {
        title: extraClaims.getTitle(),
        regions: extraClaims.getRegions(),
    };

    return ResponseWriter.successResponse(200, userInfo);
};

// Create an enriched handler, which wires up middleware to run before the above handler
const configuration = new LambdaConfiguration();
const handler = await configuration.enrichHandler(baseHandler, parentContainer);

// Export the handler to serverless.yml
export {handler};
