import {FrameworkConfiguration} from '../configuration/frameworkConfiguration';
import {ClientError} from '../errors/clientError';
import {ErrorUtils} from '../errors/errorUtils';
import {LogEntryImpl} from './logEntryImpl';
import {LoggerFactory} from './loggerFactory';
import {PerformanceThreshold} from './performanceThreshold';

/*
 * The logger factory implementation to manage winston and creating log entries
 */
export class LoggerFactoryImpl implements LoggerFactory {

    private _logConfiguration: any;
    private _apiName: string;
    private _defaultPerformanceThresholdMilliseconds: number;
    private _thresholdOverrides: PerformanceThreshold[];

    /*
     * Create the logger factory before reading configuration and set defaults
     */
    public constructor() {
        this._logConfiguration = null;
        this._apiName = 'api';
        this._defaultPerformanceThresholdMilliseconds = 1000;
        this._thresholdOverrides = [];
    }

    /*
     * Create the log entry and return it to the framework
     */
    public createLogEntry(): LogEntryImpl {

        // Create the log entry
        const logEntry = new LogEntryImpl(this._apiName);
        logEntry.setApiName(this._apiName);

        // Update performance thresholds
        logEntry.setPerformanceThresholds(
            this._defaultPerformanceThresholdMilliseconds,
            this._thresholdOverrides);

        return logEntry;
    }

    /*
     * Update the log entry from JSON configuration, which could potentially fail
     */
    public configure(configuration: FrameworkConfiguration): void {

        // Initialise behaviour
        this._logConfiguration = configuration.logging;
        this._apiName = configuration.apiName;

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
        const logEntry = this.createLogEntry();
        logEntry.setOperationName('startup');
        logEntry.setApiError(error);
        logEntry.write(null);

        // Return an error for the caller of the lambda
        return error.toClientError(this._apiName);
    }

    /*
     * Extract performance details from the log configuration, for use later when creating log entries
     */
    private _loadConfiguration() {

        // Read the default performance threshold
        const thresholds = this._logConfiguration.production.performanceThresholdsMilliseconds;

        // Update the default
        if (thresholds.default >= 0) {
            this._defaultPerformanceThresholdMilliseconds = thresholds.default;
        }

        // Support operation specific overrides, which will be set against the log entry on creation
        if (thresholds.operationOverrides) {
            for (const name in thresholds.operationOverrides) {
                if (name) {
                    const milliseconds = thresholds.operationOverrides[name];
                    const performanceThreshold = {
                        name,
                        milliseconds,
                    };

                    this._thresholdOverrides.push(performanceThreshold);
                }
            }
        }
    }
}
