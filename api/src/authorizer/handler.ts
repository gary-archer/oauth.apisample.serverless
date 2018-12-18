import {Context} from 'aws-lambda';
import * as fs from 'fs-extra';
import {OAuthConfiguration} from '../shared/configuration/oauthConfiguration';
import {AuthorizationMicroservice} from './logic/authorizationMicroservice';
import {ClaimsHandler} from './logic/claimsHandler';
import {Middleware} from './plumbing/middleware';

// Read configuration at startup
const apiConfigText = fs.readFileSync('api.config.json');
const config = JSON.parse(apiConfigText);
const oauthConfig = config.oauth as OAuthConfiguration;

const handler = async (event: any, context: Context) => {

    // Create an instance of the claims handler
    const authorizationMicroservice = new AuthorizationMicroservice();
    const claimsHandler = new ClaimsHandler(oauthConfig, event, authorizationMicroservice);

    // Enrich with cross cutting concerns
    return await claimsHandler.authorizeRequestAndSetClaims(event, context);
};

// Apply middleware and export the enriched function
const authorize = Middleware.apply(handler);
export {authorize};
