import {LoggingConfiguration} from '../../plumbing/configuration/loggingConfiguration';
import {OAuthConfiguration} from '../../plumbing/configuration/oauthConfiguration';
import {ApiConfiguration} from './apiConfiguration';

/*
 * A holder for configuration settings
 */
export interface Configuration {
    api: ApiConfiguration;
    logging: LoggingConfiguration;
    oauth: OAuthConfiguration;
}
