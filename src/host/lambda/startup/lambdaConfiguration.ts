import middy from '@middy/core';
import cors from '@middy/http-cors';
import {Context, Handler} from 'aws-lambda';
import fs from 'fs-extra';
import {Container} from 'inversify';
import {AsyncHandler,
        BaseCompositionRoot,
        DebugProxyAgentMiddleware,
        LoggerFactory,
        LoggerFactoryBuilder,
        ResponseWriter} from '../../../plumbing-base';
import {Configuration} from '../../configuration/configuration';
import {CompositionRoot} from '../../dependencies/compositionRoot';

/*
 * A class to configure the lambda and manage cross cutting concerns
 */
export class LambdaConfiguration {

    private readonly _container: Container;

    public constructor(container: Container) {
        this._container = container;
    }

    /*
     * Apply cross cutting concerns to a normal lambda
     */
    public enrichHandler(baseHandler: AsyncHandler): Handler {

        const loggerFactory = LoggerFactoryBuilder.create();
        try {

            // Load our JSON configuration
            const configuration = this._loadConfiguration();

            // Register base dependencies from common code
            const baseCompositionRoot = new BaseCompositionRoot(this._container)
                .useDiagnostics(configuration.logging, loggerFactory)
                .register();

            // Register API specific dependencies
            CompositionRoot.register(this._container);

            // Add middy middleware classes to manage error handling, logging and security
            const enrichedHandler = baseCompositionRoot.configureMiddleware(baseHandler);
            const authorizerMiddleware = baseCompositionRoot.getAuthorizerMiddleware();
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
     * Apply application specific middleware for CORS and HTTP debugging, then add the authorizer middleware
     * This sequence ensures that the lambda can be debugged locally, and that it returns CORS headers correctly in AWS
     */
    private _applyApplicationMiddleware(
        handler: middy.Middy<any, any>,
        configuration: Configuration,
        authorizerMiddleware: middy.MiddlewareObject<any, any>): middy.Middy<any, any> {

        return handler
            .use(cors({origins: configuration.api.trustedOrigins}))
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
