import {APIGatewayProxyResult} from 'aws-lambda';
import 'reflect-metadata';
import {ExtraClaims} from '../../logic/claims/extraClaims.js';
import {ClaimsPrincipal} from '../../plumbing/claims/claimsPrincipal.js';
import {BASETYPES} from '../../plumbing/dependencies/baseTypes.js';
import {APIGatewayProxyExtendedEvent} from '../../plumbing/utilities/apiGatewayExtendedProxyEvent.js';
import {ResponseWriter} from '../../plumbing/utilities/responseWriter.js';
import {LambdaInstance} from '../startup/lambdaInstance.js';

/*
 * Logic for each HTTP request uses a container per request to return API user info
 */
const baseHandler = async (event: APIGatewayProxyExtendedEvent): Promise<APIGatewayProxyResult> => {

    const claims = event.container.get<ClaimsPrincipal>(BASETYPES.ClaimsPrincipal);
    const extraClaims = claims.getExtra() as ExtraClaims;
    const userInfo = {
        title: extraClaims.title,
        regions: extraClaims.regions,
    };

    return ResponseWriter.successResponse(200, userInfo);
};

// Prepare the lambda instance, which is used for multiple HTTP requests, with cross cutting concerns
const instance = new LambdaInstance();
const handler = await instance.prepare(baseHandler);
export {handler};
