import {Context} from 'aws-lambda';
import 'reflect-metadata';
import {APIFRAMEWORKTYPES, ContainerHelper, ResponseWriter} from '../../framework-api-base';
import {SampleApiClaims} from '../claims/sampleApiClaims';
import {UserInfoClaims} from '../claims/userInfoClaims';
import {HandlerFactory} from './handlerFactory';

/*
 * Our handler acts as a REST controller
 */
const baseHandler = async (event: any, context: Context) => {

    // Get claims produced by the authorizer
    const container = ContainerHelper.current(event);
    const claims = container.get<SampleApiClaims>(APIFRAMEWORKTYPES.CoreApiClaims);

    // Create the payload and return it
    const userInfo = {
        givenName: claims.givenName,
        familyName: claims.familyName,
        email: claims.email,
    } as UserInfoClaims;

    return ResponseWriter.objectResponse(200, userInfo);
};

// Create an enriched handler, which wires up framework handling to run before the above handler
const factory = new HandlerFactory();
const handler = factory.enrichHandler(baseHandler);

// Export the handler to serverless.yml
export {handler};
