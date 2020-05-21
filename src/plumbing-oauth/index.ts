/*
 * Export OAuth public types to application code
 */

import {CustomClaimsProvider} from './src/claims/customClaimsProvider';
import {OAuthConfiguration} from './src/configuration/oauthConfiguration';
import {OAuthCompositionRoot} from './src/dependencies/oauthCompositionRoot';
import {OAUTHTYPES} from './src/dependencies/oauthTypes';

export {
    OAUTHTYPES,
    OAuthCompositionRoot,
    OAuthConfiguration,
    CustomClaimsProvider,
};
