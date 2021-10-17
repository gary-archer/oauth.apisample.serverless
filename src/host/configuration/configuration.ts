import {CacheConfiguration, LoggingConfiguration, OAuthConfiguration} from '../../plumbing';
import {ApiConfiguration} from './apiConfiguration';

/*
 * A holder for configuration settings
 */
export interface Configuration {
    api: ApiConfiguration;
    logging: LoggingConfiguration;
    oauth: OAuthConfiguration;
    cache: CacheConfiguration;
}
