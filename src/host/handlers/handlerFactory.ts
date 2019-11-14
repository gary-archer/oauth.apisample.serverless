import {Context, Handler} from 'aws-lambda';
import * as fs from 'fs-extra';
import {Container} from 'inversify';
import {MiddlewareObject, Middy} from 'middy';
import {cors} from 'middy/middlewares';
import {AsyncHandler,
        DebugProxyAgentMiddleware,
        ErrorHandler,
        FrameworkBuilder,
        LoggerFactory,
        RequestContextAuthorizerMiddleware,
        ResponseHandler} from '../../framework-api-base';
import {OAuthAuthorizerBuilder} from '../../framework-api-oauth';
import {SampleApiClaimsProvider} from '../authorization/sampleApiClaimsProvider';
import {SampleApiClaims} from '../claims/sampleApiClaims';
import {CompositionRoot} from '../configuration/compositionRoot';
import {Configuration} from '../configuration/configuration';
import {RestErrorTranslator} from '../errors/restErrorTranslator';

/*
 * A class to manage common lambda startup behaviour and injecting cross cutting concerns
 */
export class HandlerFactory {

    private readonly _container: Container;
    private readonly _loggerFactory: LoggerFactory;

    public constructor(container: Container) {
        this._container = container;
        this._loggerFactory = new LoggerFactory();
    }

    /*
     * Create a handler for a normal lambda function
     */
    public createLambdaHandler(baseHandler: AsyncHandler): Handler {

        try {
            // First load our JSON configuration
            const configuration = this._loadConfiguration();

            // Register framework dependencies
            const framework = new FrameworkBuilder(this._container, configuration.framework, this._loggerFactory)
                .withApplicationExceptionHandler(new RestErrorTranslator())
                .register();

            // Register application dependencies
            CompositionRoot.registerDependencies(this._container);

            // Configure middleware for error handling and logging as early as possible
            const enrichedHandler = framework.configureMiddleware(baseHandler, false);

            // Create the authorization middleware
            const authorizerMiddleware = new RequestContextAuthorizerMiddleware(this._container);

            // Add final middleware, and configure CORS and HTTPS debugging before the authorizer
            return this._applyApplicationMiddleware(enrichedHandler, configuration, authorizerMiddleware);

        } catch (ex) {

            // Return a handler that returns a startup error
            const clientError = ErrorHandler.handleStartupError(ex);
            return async (e: any, c: Context) => {
                return ResponseHandler.objectResponse(500, clientError);
            };
        }
    }

    /*
     * Create a handler for a lambda authorizer
     */
    public createLambdaAuthorizerHandler(baseHandler: AsyncHandler): Handler {

        try {
            // First load our JSON configuration
            const configuration = this._loadConfiguration();

            // Register base framework dependencies
            const framework = new FrameworkBuilder(this._container, configuration.framework, this._loggerFactory)
                .register();

            // Register OAuth framework dependencies
            const authorizerBuilder = new OAuthAuthorizerBuilder<SampleApiClaims>(this._container, configuration.oauth)
                .withClaimsSupplier(SampleApiClaims)
                .withCustomClaimsProviderSupplier(SampleApiClaimsProvider)
                .register();

            // Configure middleware for error handling and logging as early as possible
            const enrichedHandler = framework.configureMiddleware(baseHandler, true);

            // Create the authorization middleware
            const authorizerMiddleware = authorizerBuilder.createMiddleware();

            // Add final middleware, and configure CORS and HTTPS debugging before the authorizer
            return this._applyApplicationMiddleware(enrichedHandler, configuration, authorizerMiddleware);

        } catch (ex) {

            // Return a handler that returns a startup error
            const clientError = ErrorHandler.handleStartupError(ex);
            return async (e: any, c: Context) => {
                return ResponseHandler.objectResponse(500, clientError);
            };
        }
    }

    /*
     * Load the configuration JSON file
     */
    private _loadConfiguration(): Configuration {
        const configBuffer = fs.readFileSync('api.config.json');
        return JSON.parse(configBuffer.toString()) as Configuration;
    }

    /*
     * Apply application specific middleware for CORS and HTTP debugging, then add the authorizer middleware
     * This sequence ensures that the lambda can be debugged locally, and that it returns CORS headers correctly in AWS
     */
    private _applyApplicationMiddleware(
        handler: Middy<any, any>,
        configuration: Configuration,
        authorizerMiddleware: MiddlewareObject<any, any>): Middy<any, any> {

        return handler
            .use(cors({origins: configuration.api.trustedOrigins}))
            .use(new DebugProxyAgentMiddleware(configuration.api.useProxy, configuration.api.proxyUrl))
            .use(authorizerMiddleware);
    }
}
