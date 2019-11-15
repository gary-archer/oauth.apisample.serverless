import {Context} from 'aws-lambda';
import {Container} from 'inversify';
import middy from 'middy';
import {Middy} from 'middy';
import {BASEFRAMEWORKTYPES, LogEntry} from '../../../framework-base';
import {APIFRAMEWORKTYPES} from '../configuration/apiFrameworkTypes';
import {FrameworkConfiguration} from '../configuration/frameworkConfiguration';
import {ApplicationExceptionHandler} from '../errors/applicationExceptionHandler';
import {ClientError} from '../errors/clientError';
import {ExceptionMiddleware} from '../errors/exceptionMiddleware';
import {LogEntryImpl} from '../logging/logEntryImpl';
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl';
import {LoggerMiddleware} from '../logging/loggerMiddleware';
import {CustomHeaderMiddleware} from '../middleware/customHeaderMiddleware';
import {CoreApiClaims} from '../security/coreApiClaims';
import {AsyncHandler} from '../utilities/asyncHandler';

/*
 * A builder style class to configure framework behaviour and to register its dependencies
 */
export class FrameworkBuilder {

    private readonly _container: Container;
    private readonly _loggerFactory: LoggerFactoryImpl;
    private readonly _logEntry: LogEntryImpl;
    private _applicationExceptionHandler: ApplicationExceptionHandler | null;

    public constructor(container: Container) {

        this._container = container;
        this._applicationExceptionHandler = null;

        // Do initial safe setup to create logging objects
        this._loggerFactory = new LoggerFactoryImpl();
        this._logEntry = this._loggerFactory.getLogEntry();

        // Bind the log entry early, so that it is always available for logging
        this._container.bind<LogEntry>(BASEFRAMEWORKTYPES.LogEntry).toConstantValue(this._logEntry);
    }

    /*
     * Configure logging when the JSON configuration is provided
     */
    public configure(configuration: FrameworkConfiguration): FrameworkBuilder {
        this._loggerFactory.configure(configuration);
        return this;
    }

    /*
     * Register base framework dependencies
     */
    public register(): FrameworkBuilder {

        // Register a dummy value that is overridden by the authorizer middleware later
        // This prevents a 'Ambiguous match found for serviceIdentifier' error from inversify
        this._container.bind<CoreApiClaims>(APIFRAMEWORKTYPES.CoreApiClaims).toConstantValue({} as any);
        return this;
    }

    /*
     * Allow an application handler to translate errors before the framework handler runs
     */
    public withApplicationExceptionHandler(appExceptionHandler: ApplicationExceptionHandler): FrameworkBuilder {
        this._applicationExceptionHandler = appExceptionHandler;
        return this;
    }

    /*
     * Wrap the base handler in cross cutting middleware using the middy component
     */
    public configureMiddleware(baseHandler: AsyncHandler, isLambdaAuthorizer: boolean): Middy<any, any> {

        // Wrap the base handler and add middleware for cross cutting concerns
        // Logging and error handling are injected first so that they work in other middleware classes
        const wrappedHandler = middy(async (event: any, context: Context) => {
            return await baseHandler(event, context);

        })
        .use(new ExceptionMiddleware(this._logEntry, this._applicationExceptionHandler))
        .use(new LoggerMiddleware(this._logEntry))
        .use(new CustomHeaderMiddleware(isLambdaAuthorizer));

        // Return the base handler wrapped in cross cutting concerns
        return wrappedHandler;
    }

    /*
     * Ask our logger factory to log the startup error and return a response
     */
    public handleStartupError(error: any): ClientError {
        return this._loggerFactory.logStartupError(error);
    }
}
