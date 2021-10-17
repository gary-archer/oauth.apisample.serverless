import {LoggingConfiguration} from '../configuration/loggingConfiguration';
import {ClientError} from '../errors/clientError';
import {ErrorUtils} from '../errors/errorUtils';
import {LogEntryImpl} from './logEntryImpl';
import {LoggerFactory} from './loggerFactory';

/*
 * The logger factory implementation to manage winston and creating log entries
 */
export class LoggerFactoryImpl implements LoggerFactory {

    private _apiName: string;
    private _performanceThresholdMilliseconds: number;

    public constructor() {
        this._apiName = 'api';
        this._performanceThresholdMilliseconds = 1000;
    }

    /*
     * Create the log entry and return it to the framework
     */
    public createLogEntry(): LogEntryImpl {
        return new LogEntryImpl(this._apiName, this._performanceThresholdMilliseconds);
    }

    /*
     * Update the log entry from JSON configuration
     */
    public configure(configuration: LoggingConfiguration): void {

        this._apiName = configuration.apiName;
        this._performanceThresholdMilliseconds = configuration.performanceThresholdMilliseconds;
    }

    /*
     * Special handling for startup errors
     */
    public logStartupError(exception: any): ClientError {

        const error = ErrorUtils.createServerError(exception);
        const logEntry = this.createLogEntry();
        logEntry.setOperationName('startup');
        logEntry.setServerError(error);
        logEntry.write();
        return error.toClientError(this._apiName);
    }
}
