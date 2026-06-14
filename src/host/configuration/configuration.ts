import {LoggingConfiguration} from '../../plumbing/configuration/loggingConfiguration';
import {OAuthConfiguration} from '../../plumbing/configuration/oauthConfiguration';

/*
 * A holder for configuration settings
 */
export interface Configuration {
    logging: LoggingConfiguration;
    oauth: OAuthConfiguration;
}
