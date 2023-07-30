import {APIGatewayProxyResult} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {BaseClaims} from '../../plumbing/claims/baseClaims.js';
import {BASETYPES} from '../../plumbing/dependencies/baseTypes.js';
import {ScopeVerifier} from '../../plumbing/oauth/scopeVerifier.js';
import {ResponseWriter} from '../../plumbing/utilities/responseWriter.js';
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

    // Return user information not stored in the authorization server
    const customClaims = container.get<SampleCustomClaims>(BASETYPES.CustomClaims);
    const userInfo = {
        role: customClaims.userRole,
        regions: customClaims.userRegions,
    };

    return ResponseWriter.objectResponse(200, userInfo);
};

// Create an enriched handler, which wires up middleware to run before the above handler
const configuration = new LambdaConfiguration();
const handler = await configuration.enrichHandler(baseHandler, container);

// Export the handler to serverless.yml
export {handler};
