import middy from '@middy/core';
import {Context, Handler} from 'aws-lambda';
import fs from 'fs-extra';
import {Container} from 'inversify';
import {AsyncHandler,
        BaseCompositionRoot,
        HttpProxyMiddleware,
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
            const base = new BaseCompositionRoot(this._container)
                .useDiagnostics(configuration.logging, loggerFactory)
                .register();

            // Register common code OAuth dependencies
            const oauth = new OAuthCompositionRoot<SampleApiClaims>(this._container)
                .useOAuth(configuration.oauth)
                .withClaimsSupplier(SampleApiClaims)
                .withCustomClaimsProviderSupplier(SampleApiClaimsProvider)
                .register();

            // Configure middy middleware classes
            return this._configureMiddleware(baseHandler, base, oauth, configuration);

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
        oauth: OAuthCompositionRoot<SampleApiClaims>,
        configuration: Configuration): middy.Middy<any, any> {

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
        .use(new HttpProxyMiddleware(configuration.api.useProxy, configuration.api.proxyUrl))
        .use(authorizerMiddleware)
        .use(customHeaderMiddleware);
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
