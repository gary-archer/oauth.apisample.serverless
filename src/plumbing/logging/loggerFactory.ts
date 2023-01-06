import {ClientError} from '../errors/clientError.js';

/*
 * An interface that allows business logic to access logging objects
 */
export interface LoggerFactory {
    logStartupError(exception: any): ClientError;
}
