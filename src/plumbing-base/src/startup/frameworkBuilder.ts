import {Context} from 'aws-lambda';
import {Container} from 'inversify';
import middy from 'middy';
import {Middy} from 'middy';
import {CoreApiClaims} from '../claims/coreApiClaims';
import {BASETYPES} from '../configuration/BASETYPES';
import {LoggingConfiguration} from '../configuration/loggingConfiguration';
import {ClientError} from '../errors/clientError';
import {LogEntry} from '../logging/LogEntry';
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl';
import {CustomHeaderMiddleware} from '../middleware/customHeaderMiddleware';
import {ExceptionMiddleware} from '../middleware/exceptionMiddleware';
import {LoggerMiddleware} from '../middleware/loggerMiddleware';
import {AsyncHandler} from '../utilities/asyncHandler';

/*
 * A builder style class to configure framework behaviour and to register its dependencies
 */
export class FrameworkBuilder {

    private readonly _container: Container;
    private readonly _loggerFactory: LoggerFactoryImpl;
    private _configuration: LoggingConfiguration | null;

    public constructor(container: Container) {
        this._container = container;
        this._configuration = null;
        this._loggerFactory = new LoggerFactoryImpl();
    }

    /*
     * Configure logging when the JSON configuration is provided
     */
    public configure(configuration: LoggingConfiguration): FrameworkBuilder {
        this._configuration = configuration;
        this._loggerFactory.configure(configuration);
        return this;
    }

    /*
     * Wrap the base handler in cross cutting middleware using the middy component
     */
    public configureMiddleware(baseHandler: AsyncHandler): Middy<any, any> {

        // Wrap the base handler and add middleware for cross cutting concerns
        // Error handling and logging are injected early so that they work in other middleware classes
        const wrappedHandler = middy(async (event: any, context: Context) => {
            return await baseHandler(event, context);

        })
        .use(new LoggerMiddleware(this._container, this._loggerFactory))
        .use(new ExceptionMiddleware(this._container, this._configuration!))
        .use(new CustomHeaderMiddleware(this._configuration!.apiName));

        // Return the base handler wrapped in cross cutting concerns
        return wrappedHandler;
    }

    /*
     * Register base framework dependencies
     */
    public register(): FrameworkBuilder {

        // Register default values for these per request objects against the parent container
        this._container.bind<LogEntry>(BASETYPES.LogEntry).toConstantValue({} as any);
        this._container.bind<CoreApiClaims>(BASETYPES.CoreApiClaims).toConstantValue({} as any);
        return this;
    }

    /*
     * Ask our logger factory to log the startup error and return a response
     */
    public handleStartupError(error: any): ClientError {
        return this._loggerFactory.logStartupError(error);
    }
}
