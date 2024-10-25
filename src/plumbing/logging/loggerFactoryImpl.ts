import {LoggingConfiguration} from '../configuration/loggingConfiguration.js';
import {ClientError} from '../errors/clientError.js';
import {ErrorUtils} from '../errors/errorUtils.js';
import {LogEntryImpl} from './logEntryImpl.js';
import {LoggerFactory} from './loggerFactory.js';

/*
 * The logger factory implementation to manage winston and creating log entries
 */
export class LoggerFactoryImpl implements LoggerFactory {

    private apiName: string;
    private prettyPrint: boolean;
    private performanceThresholdMilliseconds: number;

    public constructor() {
        this.apiName = 'api';
        this.prettyPrint = false;
        this.performanceThresholdMilliseconds = 1000;
    }

    /*
     * Update the log entry from JSON configuration
     */
    public configure(configuration: LoggingConfiguration): void {

        this.apiName = configuration.apiName;
        this.prettyPrint = configuration.prettyPrint;
        this.performanceThresholdMilliseconds = configuration.performanceThresholdMilliseconds;
    }

    /*
     * Create the log entry and return it to the framework
     */
    public createLogEntry(): LogEntryImpl {
        return new LogEntryImpl(this.apiName, this.prettyPrint, this.performanceThresholdMilliseconds);
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
        return error.toClientError(this.apiName);
    }
}
