import {CacheConfiguration} from '../../plumbing/configuration/cacheConfiguration.js';
import {LoggingConfiguration} from '../../plumbing/configuration/loggingConfiguration.js';
import {OAuthConfiguration} from '../../plumbing/configuration/oauthConfiguration.js';
import {ApiConfiguration} from './apiConfiguration.js';

/*
 * A holder for configuration settings
 */
export interface Configuration {
    api: ApiConfiguration;
    logging: LoggingConfiguration;
    oauth: OAuthConfiguration;
    cache: CacheConfiguration;
}
