import {APIGatewayProxyResult} from 'aws-lambda';
import 'reflect-metadata';
import {ClaimsPrincipal} from '../middleware/claims/claimsPrincipal';
import {LambdaFactory} from '../middleware/lambdaFactory';
import {APIGatewayProxyExtendedEvent} from '../utilities/apiGatewayExtendedProxyEvent';
import {ResponseWriter} from '../utilities/responseWriter';

/*
 * This user info is separate to the OpenID Connect user info that returns core user attributes
 */
const baseHandler = async (event: APIGatewayProxyExtendedEvent): Promise<APIGatewayProxyResult> => {

    // Return product specific user info from the API to clients
    const claims = event.container.get(ClaimsPrincipal);
    const userInfo = {
        title: claims.getExtra().title,
        regions: claims.getExtra().regions,
    };

    return ResponseWriter.successResponse(200, userInfo);
};

// Prepare the lambda handler, which is used for multiple HTTP requests, with cross cutting concerns
const factory = new LambdaFactory();
const handler = await factory.create(baseHandler);
export {handler};
