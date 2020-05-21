import {FrameworkConfiguration} from '../../plumbing-base';
import {OAuthConfiguration} from '../../plumbing-oauth';
import {ApiConfiguration} from './apiConfiguration';

/*
 * A holder for configuration settings
 */
export interface Configuration {
    api: ApiConfiguration;
    framework: FrameworkConfiguration;
    oauth: OAuthConfiguration;
}
