import {Container} from 'inversify';

/*
 * Information created at startup
 */
export interface StartupInfo {
    configuration: any;
    container: Container;
}
