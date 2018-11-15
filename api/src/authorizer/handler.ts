import * as fs from 'fs-extra';
import {OAuthConfiguration} from './configuration/oauthConfiguration';
import {AuthorizationMicroservice} from './logic/authorizationMicroservice';
import {ClaimsHandler} from './logic/claimsHandler';

// Read configuration
const apiConfigText = fs.readFileSync('auth.config.json');
const config = JSON.parse(apiConfigText);
const oauthConfig = config.oauth as OAuthConfiguration;

// Set up the authorize operation
const authorizationMicroservice = new AuthorizationMicroservice();
const claimsHandler = new ClaimsHandler(oauthConfig, authorizationMicroservice);
const authorize = claimsHandler.authorizeRequestAndSetClaims;

// Export the  functions
export {authorize};
