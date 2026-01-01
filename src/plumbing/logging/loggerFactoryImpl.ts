import {LoggingConfiguration} from '../configuration/loggingConfiguration';
import {ClientError} from '../errors/clientError';
import {ErrorUtils} from '../errors/errorUtils';
import {LogEntryImpl} from './logEntryImpl';
import {Logger} from './logger';
import {LoggerFactory} from './loggerFactory';

/*
 * The logger factory implementation to manage winston and creating log entries
 */
export class LoggerFactoryImpl implements LoggerFactory {

    private apiName: string;
    private performanceThresholdMilliseconds: number;
    private requestLogger: Logger | null;
    private auditLogger: Logger | null;

    public constructor() {
        this.apiName = '';
        this.performanceThresholdMilliseconds = 1000;
        this.requestLogger = null;
        this.auditLogger = null;
    }

    /*
     * Create loggers from JSON configuration
     */
    public configure(configuration: LoggingConfiguration): void {

        this.apiName = configuration.apiName;

        // Create the fixed request logger
        const requestLogConfig = configuration.loggers.find((l: any) => l.type === 'request');
        if (requestLogConfig) {
            this.performanceThresholdMilliseconds = requestLogConfig.performanceThresholdMilliseconds;
            this.requestLogger = new Logger('request', requestLogConfig.prettyPrint);
        }

        // Create the fixed audit logger
        const auditLogConfig = configuration.loggers.find((l: any) => l.type === 'audit');
        if (auditLogConfig) {
            this.auditLogger = new Logger('audit', requestLogConfig.prettyPrint);
        }
    }

    /*
     * Create the log entry and return it to the framework
     */
    public createLogEntry(): LogEntryImpl {
        return new LogEntryImpl(this.apiName, this.performanceThresholdMilliseconds);
    }

    /*
     * Special handling for startup errors
     */
    public logStartupError(exception: any): ClientError {

        if (!this.requestLogger) {
            this.requestLogger = new Logger('request', false);
        }

        const error = ErrorUtils.createServerError(exception);
        const logEntry = this.createLogEntry();
        logEntry.setOperationName('startup');
        logEntry.setServerError(error);

        this.getRequestLogger()?.write(logEntry.getRequestLog());
        return error.toClientError(this.apiName);
    }

    /*
     * Return the request logger
     */
    public getRequestLogger(): Logger | null {
        return this.requestLogger;
    }

    /*
     * Return the audit logger
     */
    public getAuditLogger(): Logger | null {
        return this.auditLogger;
    }
}
