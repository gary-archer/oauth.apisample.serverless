import middy from '@middy/core';
import {Context, Handler} from 'aws-lambda';
import fs from 'fs-extra';
import {Container} from 'inversify';
import {
    AsyncHandler,
    BaseCompositionRoot,
    HttpProxy,
    LoggerFactory,
    LoggerFactoryBuilder,
    ResponseWriter} from '../../../plumbing-base';
import {OAuthCompositionRoot} from '../../../plumbing-oauth';
import {SampleCustomClaimsProvider} from '../../claims/sampleCustomClaimsProvider';
import {Configuration} from '../../configuration/configuration';

/*
 * A class to manage common lambda startup behaviour and injecting cross cutting concerns
 */
export class AuthorizerConfiguration {

    private readonly _container: Container;

    public constructor(container: Container) {
        this._container = container;
    }

    /*
     * Enrich a handler for a lambda authorizer
     */
    public enrichHandler(baseHandler: AsyncHandler): Handler {

        const loggerFactory = LoggerFactoryBuilder.create();
        try {

            // Load our JSON configuration
            const configuration = this._loadConfiguration();

            // Create the HTTP proxy object
            const httpProxy = new HttpProxy(configuration.api.useProxy, configuration.api.proxyUrl);

            // Register common code dependencies for logging and error handling
            const base = new BaseCompositionRoot(this._container)
                .useLogging(configuration.logging, loggerFactory)
                .useHttpProxy(httpProxy)
                .register();

            // Register common code OAuth dependencies
            const oauth = new OAuthCompositionRoot(this._container)
                .useOAuth(configuration.oauth)
                .withCustomClaimsProvider(new SampleCustomClaimsProvider())
                .useHttpProxy(httpProxy)
                .register();

            // Configure middy middleware classes
            return this._configureMiddleware(baseHandler, base, oauth);

        } catch (e) {

            // Handle any startup exceptions
            return this._handleStartupError(loggerFactory, e);
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
     * Wrap the base handler in cross cutting middleware using the middy component
     */
    private _configureMiddleware(
        baseHandler: AsyncHandler,
        base: BaseCompositionRoot,
        oauth: OAuthCompositionRoot): middy.Middy<any, any> {

        // Get framework middleware classes including an OAuth authorizer
        const loggerMiddleware = base.getLoggerMiddleware();
        const exceptionMiddleware = base.getExceptionMiddleware();
        const authorizerMiddleware = oauth.getAuthorizerMiddleware();
        const customHeaderMiddleware = base.getCustomHeaderMiddleware();

        // Wrap the base handler and add middleware for cross cutting concerns
        // Error handling and logging are injected early so that they work in other middleware classes
        return middy(async (event: any, context: Context) => {
            return baseHandler(event, context);

        })
            .use(loggerMiddleware)
            .use(exceptionMiddleware)
            .use(authorizerMiddleware)
            .use(customHeaderMiddleware);
    }

    /*
     * Ensure that any startup errors are logged and then return a handler that will provide the client response
     */
    private _handleStartupError(loggerFactory: LoggerFactory, error: any): Handler {

        const clientError = loggerFactory.logStartupError(error);
        return async () => {
            return ResponseWriter.objectResponse(500, clientError.toResponseFormat());
        };
    }
}
