import middy from '@middy/core';
import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from 'aws-lambda';
import fs from 'fs-extra';
import {Container} from 'inversify';
import {BaseCompositionRoot} from '../../plumbing/dependencies/baseCompositionRoot';
import {LoggerFactory} from '../../plumbing/logging/loggerFactory';
import {LoggerFactoryBuilder} from '../../plumbing/logging/loggerFactoryBuilder';
import {HttpProxy} from '../../plumbing/utilities/httpProxy';
import {ResponseWriter} from '../../plumbing/utilities/responseWriter';
import {SampleCustomClaimsProvider} from '../claims/sampleCustomClaimsProvider';
import {Configuration} from '../configuration/configuration';
import {CompositionRoot} from '../dependencies/compositionRoot';

/*
 * A shorthand type for this module
 */
type AsyncHandler = (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;

/*
 * A class to configure the lambda and manage cross cutting concerns
 */
export class LambdaConfiguration {

    /*
     * Apply cross cutting concerns to a lambda
     */
    public enrichHandler(baseHandler: AsyncHandler, container: Container)
        : middy.MiddyfiedHandler<APIGatewayProxyEvent, APIGatewayProxyResult> | AsyncHandler {

        const loggerFactory = LoggerFactoryBuilder.create();
        try {

            // Load our JSON configuration
            const configuration = this._loadConfiguration();

            // Create the HTTP proxy object
            const httpProxy = new HttpProxy(configuration.api.useProxy, configuration.api.proxyUrl);

            // Register common code dependencies for security, logging and error handling
            const base = new BaseCompositionRoot(container)
                .useLogging(configuration.logging, loggerFactory)
                .useOAuth(configuration.oauth)
                .withCustomClaimsProvider(new SampleCustomClaimsProvider(), configuration.cache)
                .useHttpProxy(httpProxy)
                .register();

            // Register API specific dependencies
            CompositionRoot.register(container);

            // Get framework middleware classes including the OAuth authorizer
            const loggerMiddleware = base.getLoggerMiddleware();
            const exceptionMiddleware = base.getExceptionMiddleware();
            const authorizerMiddleware = base.getAuthorizerMiddleware();
            const customHeaderMiddleware = base.getCustomHeaderMiddleware();

            // Wrap the base handler and add middleware for cross cutting concerns
            return middy(async (event: APIGatewayProxyEvent, context: Context) => {
                return baseHandler(event, context);

            })
                .use(loggerMiddleware)
                .use(exceptionMiddleware)
                .use(authorizerMiddleware)
                .use(customHeaderMiddleware);

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
     * Ensure that any startup errors are logged and then return a handler that will provide the client response
     */
    private _handleStartupError(loggerFactory: LoggerFactory, error: any): AsyncHandler {

        const clientError = loggerFactory.logStartupError(error);
        return async () => {
            return ResponseWriter.objectResponse(500, clientError.toResponseFormat());
        };
    }
}
