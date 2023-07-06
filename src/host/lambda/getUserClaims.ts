import {APIGatewayProxyResult} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {BaseClaims} from '../../plumbing/claims/baseClaims.js';
import {BASETYPES} from '../../plumbing/dependencies/baseTypes.js';
import {ScopeVerifier} from '../../plumbing/oauth/scopeVerifier.js';
import {ResponseWriter} from '../../plumbing/utilities/responseWriter.js';
import {UserInfoClaims} from '../../plumbing/claims/userInfoClaims.js';
import {LambdaConfiguration} from '../startup/lambdaConfiguration.js';
import {SampleCustomClaims} from '../../logic/entities/sampleCustomClaims.js';

/*
 * Our handler acts as a REST controller
 */
const container = new Container();
const baseHandler = async (): Promise<APIGatewayProxyResult> => {

    // First check scopes
    const baseClaims = container.get<BaseClaims>(BASETYPES.BaseClaims);
    ScopeVerifier.enforce(baseClaims.scopes, 'investments');

    // Get both OAuth User Info and domain specific user info
    const userClaims = container.get<UserInfoClaims>(BASETYPES.UserInfoClaims);
    const customClaims = container.get<SampleCustomClaims>(BASETYPES.CustomClaims);

    // Return a payload with whatever the UI needs
    const userInfo = {
        givenName: userClaims.givenName,
        familyName: userClaims.familyName,
        regions: customClaims.userRegions,
    };

    return ResponseWriter.objectResponse(200, userInfo);
};

// Create an enriched handler, which wires up middleware to run before the above handler
const configuration = new LambdaConfiguration();
const handler = await configuration.enrichHandler(baseHandler, container);

// Export the handler to serverless.yml
export {handler};
