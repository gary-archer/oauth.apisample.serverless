import {LoggingConfiguration} from './loggingConfiguration';
import {OAuthConfiguration} from './oauthConfiguration';

/*
 * A holder for configuration settings
 */
export interface Configuration {
    logging: LoggingConfiguration;
    oauth: OAuthConfiguration;
}
