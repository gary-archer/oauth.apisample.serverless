import {LoggingConfiguration} from '../configuration/loggingConfiguration.js';
import {ClientError} from '../errors/clientError.js';
import {ErrorUtils} from '../errors/errorUtils.js';
import {LogEntryImpl} from './logEntryImpl.js';
import {LoggerFactory} from './loggerFactory.js';

/*
 * The logger factory implementation to manage winston and creating log entries
 */
export class LoggerFactoryImpl implements LoggerFactory {

    private _apiName: string;
    private _prettyPrint: boolean;
    private _performanceThresholdMilliseconds: number;

    public constructor() {
        this._apiName = 'api';
        this._prettyPrint = false;
        this._performanceThresholdMilliseconds = 1000;
    }

    /*
     * Update the log entry from JSON configuration
     */
    public configure(configuration: LoggingConfiguration): void {

        this._apiName = configuration.apiName;
        this._prettyPrint = configuration.prettyPrint;
        this._performanceThresholdMilliseconds = configuration.performanceThresholdMilliseconds;
    }

    /*
     * Create the log entry and return it to the framework
     */
    public createLogEntry(): LogEntryImpl {
        return new LogEntryImpl(this._apiName, this._prettyPrint, this._performanceThresholdMilliseconds);
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
