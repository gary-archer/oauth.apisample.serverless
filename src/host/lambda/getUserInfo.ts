import {APIGatewayProxyResult} from 'aws-lambda';
import 'reflect-metadata';
import {ClaimsPrincipal} from '../../plumbing/claims/claimsPrincipal.js';
import {BASETYPES} from '../../plumbing/dependencies/baseTypes.js';
import {APIGatewayProxyExtendedEvent} from '../../plumbing/utilities/apiGatewayExtendedProxyEvent.js';
import {ResponseWriter} from '../../plumbing/utilities/responseWriter.js';
import {LambdaInstance} from '../startup/lambdaInstance.js';

/*
 * This user info is separate to the OpenID Connect user info that returns core user attributes
 */
const baseHandler = async (event: APIGatewayProxyExtendedEvent): Promise<APIGatewayProxyResult> => {

    // Return product specific user info from the API to clients
    const claims = event.container.get<ClaimsPrincipal>(BASETYPES.ClaimsPrincipal);
    const userInfo = {
        title: claims.getExtra().title,
        regions: claims.getExtra().regions,
    };

    return ResponseWriter.successResponse(200, userInfo);
};

// Prepare the lambda instance, which is used for multiple HTTP requests, with cross cutting concerns
const instance = new LambdaInstance();
const handler = await instance.prepare(baseHandler);
export {handler};
