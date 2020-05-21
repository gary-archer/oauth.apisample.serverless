import {Context} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {APIFRAMEWORKTYPES, ResponseWriter} from '../../plumbing-base';
import {SampleApiClaims} from '../claims/sampleApiClaims';
import {UserInfoClaims} from '../claims/userInfoClaims';
import {HandlerFactory} from './handlerFactory';

const container = new Container();

/*
 * Our handler acts as a REST controller
 */
const baseHandler = async (event: any, context: Context) => {

    // Get claims produced by the authorizer
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
const factory = new HandlerFactory(container);
const handler = factory.enrichHandler(baseHandler);

// Export the handler to serverless.yml
export {handler};
