import {FrameworkConfiguration} from '../configuration/frameworkConfiguration';
import {ClientError} from '../errors/clientError';
import {ErrorUtils} from '../errors/errorUtils';
import {LogEntryImpl} from './logEntryImpl';
import {LoggerFactory} from './loggerFactory';

/*
 * The logger factory implementation to manage winston and creating log entries
 */
export class LoggerFactoryImpl implements LoggerFactory {

    private _logConfiguration: any;
    private _logEntry: LogEntryImpl;
    private _apiName: string;

    /*
     * We create the logger factory before reading configuration, since we need to log problems loading configuration
     */
    public constructor() {
        this._logConfiguration = null;
        this._apiName = 'api';
        this._logEntry = new LogEntryImpl(this._apiName);
    }

    /*
     * Return the log entry to the framework
     */
    public getLogEntry(): LogEntryImpl {
        return this._logEntry;
    }

    /*
     * Update the log entry from JSON configuration, which could potentially fail
     */
    public configure(configuration: FrameworkConfiguration): void {

        // Initialise behaviour
        this._logConfiguration = configuration.logging;
        this._apiName = configuration.apiName;
        this._logEntry.setApiName(this._apiName);

        // Initialise logging behaviour from configuration
        this._loadConfiguration();
    }

    /*
     * Special handling for startup errors
     */
    public logStartupError(exception: any): ClientError {

        // Get the error into a loggable format
        const error = ErrorUtils.createApiError(exception);

        // Set error details
        this._logEntry.setOperationName('startup');
        this._logEntry.setApiError(error);
        this._logEntry.write();

        // Return an error for the caller of the lambda
        return error.toClientError(this._apiName);
    }

    /*
     * Extract performance details from the log configuration, for use later when creating log entries
     */
    private _loadConfiguration() {
    }
}
