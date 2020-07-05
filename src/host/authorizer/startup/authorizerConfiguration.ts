import middy from '@middy/core';
import {Context, Handler} from 'aws-lambda';
import fs from 'fs-extra';
import {Container} from 'inversify';
import {AsyncHandler,
        BaseCompositionRoot,
        DebugProxyAgentMiddleware,
        LoggerFactory,
        LoggerFactoryBuilder,
        ResponseWriter} from '../../../plumbing-base';
import {OAuthCompositionRoot} from '../../../plumbing-oauth';
import {SampleApiClaims} from '../../claims/sampleApiClaims';
import {SampleApiClaimsProvider} from '../../claims/sampleApiClaimsProvider';
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

            // Register common code dependencies for logging and error handling
            const base= new BaseCompositionRoot(this._container)
                .useDiagnostics(configuration.logging, loggerFactory)
                .register();

            // Register common code OAuth dependencies
            const oauth = new OAuthCompositionRoot<SampleApiClaims>(this._container)
                .useOAuth(configuration.oauth)
                .withClaimsSupplier(SampleApiClaims)
                .withCustomClaimsProviderSupplier(SampleApiClaimsProvider)
                .register();

            // Add middy middleware classes
            const enrichedHandler = base.configureMiddleware(baseHandler);
            const authorizerMiddleware = oauth.getAuthorizerMiddleware();
            return this._applyApplicationMiddleware(enrichedHandler, configuration, authorizerMiddleware);

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
     * Apply application specific middleware for HTTP debugging, then add the authorizer middleware
     */
    private _applyApplicationMiddleware(
        handler: middy.Middy<any, any>,
        configuration: Configuration,
        authorizerMiddleware: middy.MiddlewareObject<any, any>): middy.Middy<any, any> {

        return handler
            .use(new DebugProxyAgentMiddleware(configuration.api.useProxy, configuration.api.proxyUrl))
            .use(authorizerMiddleware);
    }

    /*
     * Ensure that any startup errors are logged and then return a handler that will provide the client response
     */
    private _handleStartupError(loggerFactory: LoggerFactory, error: any): Handler {

        const clientError = loggerFactory.logStartupError(error);
        return async (e: any, c: Context) => {
            return ResponseWriter.objectResponse(500, clientError.toResponseFormat());
        };
    }
}
