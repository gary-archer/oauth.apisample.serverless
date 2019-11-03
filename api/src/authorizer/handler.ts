import {Context} from 'aws-lambda';
import * as fs from 'fs-extra';
import {OAuthConfiguration} from '../shared/configuration/oauthConfiguration';
import {Authenticator} from './logic/authenticator';
import {AuthorizationMicroservice} from './logic/authorizationMicroservice';
import {ClaimsMiddleware} from './logic/claimsMiddleware';
import {Middleware} from './plumbing/middleware';

// Read configuration at startup
const apiConfigBuffer = fs.readFileSync('api.config.json');
const config = JSON.parse(apiConfigBuffer.toString());
const oauthConfig = config.oauth as OAuthConfiguration;

const handler = async (event: any, context: Context) => {

    // Create dependencies
    const authenticator = new Authenticator(oauthConfig, event.log);
    const authorizationMicroservice = new AuthorizationMicroservice();
    const claimsHandler = new ClaimsMiddleware(authenticator, authorizationMicroservice, event.log);

    // Run the logic
    return await claimsHandler.authorizeRequestAndSetClaims(event, context);
};

// Apply middleware and export the enriched function
const authorize = Middleware.apply(handler);
export {authorize};
