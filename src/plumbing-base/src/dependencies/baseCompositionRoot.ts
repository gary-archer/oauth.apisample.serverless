import middy from '@middy/core';
import {Context} from 'aws-lambda';
import {Container} from 'inversify';
import {CoreApiClaims} from '../claims/coreApiClaims';
import {RequestContextAuthorizer} from '../claims/requestContextAuthorizer';
import {LoggingConfiguration} from '../configuration/loggingConfiguration';
import {BASETYPES} from '../dependencies/baseTypes';
import {LogEntry} from '../logging/LogEntry';
import {LoggerFactory} from '../logging/loggerFactory';
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl';
import {CustomHeaderMiddleware} from '../middleware/customHeaderMiddleware';
import {ExceptionMiddleware} from '../middleware/exceptionMiddleware';
import {LoggerMiddleware} from '../middleware/loggerMiddleware';
import {AsyncHandler} from '../utilities/asyncHandler';

/*
 * Register dependencies to manage cross cutting concerns
 */
export class BaseCompositionRoot {

    // Constructor properties
    private readonly _container: Container;

    // Builder properties
    private _loggingConfiguration: LoggingConfiguration | null;
    private _loggerFactory: LoggerFactoryImpl | null;

    /*
     * Set initial values
     */
    public constructor(container: Container) {
        this._container = container;
        this._loggingConfiguration = null;
        this._loggerFactory = null;
    }

    /*
     * Receive logging configuration and use common code for logging and error handling
     */
    public useDiagnostics(
        loggingConfiguration: LoggingConfiguration,
        loggerFactory: LoggerFactory): BaseCompositionRoot {

        this._loggingConfiguration = loggingConfiguration;
        this._loggerFactory = loggerFactory as LoggerFactoryImpl;
        this._loggerFactory.configure(loggingConfiguration);
        return this;
    }

    /*
     * Register base framework dependencies
     */
    public register(): BaseCompositionRoot  {
        this._registerLoggingDependencies();
        this._registerClaimsDependencies();
        return this;
    }

    /*
     * Wrap the base handler in cross cutting middleware using the middy component
     */
    public configureMiddleware(baseHandler: AsyncHandler): middy.Middy<any, any> {

        // Wrap the base handler and add middleware for cross cutting concerns
        // Error handling and logging are injected early so that they work in other middleware classes
        const wrappedHandler = middy(async (event: any, context: Context) => {
            return await baseHandler(event, context);

        })
        .use(new LoggerMiddleware(this._container, this._loggerFactory!))
        .use(new ExceptionMiddleware(this._container, this._loggingConfiguration!))
        .use(new CustomHeaderMiddleware(this._loggingConfiguration!.apiName));

        // Return the base handler wrapped in cross cutting concerns
        return wrappedHandler;
    }

    /*
     * Get a default authorizer middleware that looks up claims from the request context
     */
    public getRequestContextAuthorizer(): middy.MiddlewareObject<any, any> {
        return new RequestContextAuthorizer(this._container);
    }

    /*
     * Register any common code logging dependencies
     */
    private _registerLoggingDependencies() {

        // This default per request object will be overridden at runtime
        this._container.bind<LogEntry>(BASETYPES.LogEntry).toConstantValue({} as any);
    }

    /*
     * Register any common code claims dependencies
     */
    private _registerClaimsDependencies() {

        // This default per request object will be overridden at runtime
        this._container.bind<CoreApiClaims>(BASETYPES.CoreApiClaims).toConstantValue({} as any);
    }
}
