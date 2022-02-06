import {APIGatewayProxyResult} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {BaseClaims} from '../../plumbing/claims/baseClaims';
import {BASETYPES} from '../../plumbing/dependencies/baseTypes';
import {ScopeVerifier} from '../../plumbing/oauth/scopeVerifier';
import {ResponseWriter} from '../../plumbing/utilities/responseWriter';
import {UserInfoClaims} from '../../plumbing/claims/userInfoClaims';
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
const configuration = new LambdaConfiguration();
const handler = configuration.enrichHandler(baseHandler, container);

// Export the handler to serverless.yml
export {handler};
