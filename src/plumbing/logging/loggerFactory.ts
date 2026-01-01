import {LoggingConfiguration} from '../configuration/loggingConfiguration';
import {ClientError} from '../errors/clientError';
import {Logger} from './logger';

/*
 * An interface to create and get logger objects
 */
export interface LoggerFactory {

    // Configuration at startup
    configure(configuration: LoggingConfiguration): void;

    // Handle startup errors
    logStartupError(exception: any): ClientError;

    // Return the request logger
    getRequestLogger(): Logger | null;

    // Return the audit logger
    getAuditLogger(): Logger | null;
}
