import {APIGatewayProxyResult} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {BaseClaims, BASETYPES, ResponseWriter, ScopeVerifier, UserInfoClaims} from '../../plumbing';
import {LambdaConfiguration} from '../startup/lambdaConfiguration';

/*
 * Our handler acts as a REST controller
 */
const container = new Container();
const baseHandler = async (): Promise<APIGatewayProxyResult> => {

    // First check scopes
    const baseClaims = container.get<BaseClaims>(BASETYPES.BaseClaims);
    ScopeVerifier.enforce(baseClaims.scopes, 'transactions_read');

    // Create the payload and return it
    const claims = container.get<UserInfoClaims>(BASETYPES.UserInfoClaims);
    const userInfo = {
        givenName: claims.givenName,
        familyName: claims.familyName,
    };

    return ResponseWriter.objectResponse(200, userInfo);
};

// Create an enriched handler, which wires up middleware to run before the above handler
const configuration = new LambdaConfiguration(container);
const handler = configuration.enrichHandler(baseHandler);

// Export the handler to serverless.yml
export {handler};
