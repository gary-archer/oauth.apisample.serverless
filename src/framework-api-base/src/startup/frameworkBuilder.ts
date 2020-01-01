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
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl';
import {LoggerMiddleware} from '../logging/loggerMiddleware';
import {ChildContainerMiddleware} from '../middleware/childContainerMiddleware';
import {CustomHeaderMiddleware} from '../middleware/customHeaderMiddleware';
import {CoreApiClaims} from '../security/coreApiClaims';
import {AsyncHandler} from '../utilities/asyncHandler';

/*
 * A builder style class to configure framework behaviour and to register its dependencies
 */
export class FrameworkBuilder {

    private readonly _container: Container;
    private readonly _loggerFactory: LoggerFactoryImpl;
    private _configuration: FrameworkConfiguration | null;
    private _applicationExceptionHandler: ApplicationExceptionHandler | null;

    public constructor(container: Container) {
        this._container = container;
        this._configuration = null;
        this._applicationExceptionHandler = null;
        this._loggerFactory = new LoggerFactoryImpl();
    }

    /*
     * Configure logging when the JSON configuration is provided
     */
    public configure(configuration: FrameworkConfiguration): FrameworkBuilder {
        this._configuration = configuration;
        this._loggerFactory.configure(configuration);
        return this;
    }

    /*
     * Register base framework dependencies
     */
    public register(): FrameworkBuilder {

        // Register default values for these per request objects against the parent container
        this._container.bind<LogEntry>(BASEFRAMEWORKTYPES.LogEntry).toConstantValue({} as any);
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
    public configureMiddleware(baseHandler: AsyncHandler): Middy<any, any> {

        // Wrap the base handler and add middleware for cross cutting concerns
        // Error handling and logging are injected early so that they work in other middleware classes
        const wrappedHandler = middy(async (event: any, context: Context) => {
            return await baseHandler(event, context);

        })
        .use(new ChildContainerMiddleware(this._container))
        .use(new LoggerMiddleware(this._loggerFactory))
        .use(new ExceptionMiddleware(this._applicationExceptionHandler))
        .use(new CustomHeaderMiddleware(this._configuration!.apiName));

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
