import middy from '@middy/core';
import {Context} from 'aws-lambda';
import {Container} from 'inversify';
import {CoreApiClaims} from '../claims/coreApiClaims';
import {RequestContextAuthenticator} from '../claims/requestContextAuthenticator';
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

    private readonly _container: Container;
    private readonly _loggerFactory: LoggerFactoryImpl;
    private _configuration: LoggingConfiguration | null;
    private _isAuthorizer: boolean;

    /*
     * Initialise global objects
     */
    public constructor(container: Container, loggerFactory: LoggerFactory) {
        this._container = container;
        this._configuration = null;
        this._loggerFactory = loggerFactory as LoggerFactoryImpl;
        this._isAuthorizer = false;
    }

    /*
     * Configure logging when the JSON configuration is provided
     */
    public configure(configuration: LoggingConfiguration): BaseCompositionRoot {
        this._configuration = configuration;
        this._loggerFactory.configure(configuration);
        return this;
    }

    /*
     * Configure logging when the JSON configuration is provided
     */
    public asAuthorizer(): BaseCompositionRoot {
        this._isAuthorizer = true;
        return this;
    }

    /*
     * Register base framework dependencies
     */
    public register(): BaseCompositionRoot  {

        // Register default values for these per request objects against the parent container
        this._container.bind<LogEntry>(BASETYPES.LogEntry).toConstantValue({} as any);
        this._container.bind<CoreApiClaims>(BASETYPES.CoreApiClaims).toConstantValue({} as any);

        // If this is a normal lambda then register an object to get claims from the request context
        if (!this._isAuthorizer) {
            this._container.bind<RequestContextAuthenticator>(BASETYPES.RequestContextAuthenticator)
                .to(RequestContextAuthenticator).inTransientScope();
        }

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
        .use(new LoggerMiddleware(this._container, this._loggerFactory))
        .use(new ExceptionMiddleware(this._container, this._configuration!))
        .use(new CustomHeaderMiddleware(this._configuration!.apiName));

        // Return the base handler wrapped in cross cutting concerns
        return wrappedHandler;
    }

    /*
     * Get a default authorizer middleware that looks up claims from the request context
     */
    public getAuthorizerMiddleware(): middy.MiddlewareObject<any, any> {
        return new RequestContextAuthorizer(this._container);
    }
}
