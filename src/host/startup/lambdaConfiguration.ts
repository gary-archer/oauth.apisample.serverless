import middy from '@middy/core';
import {APIGatewayProxyResult, Context} from 'aws-lambda';
import fs from 'fs-extra';
import {Container} from 'inversify';
import {SampleExtraClaimsProvider} from '../../logic/claims/sampleExtraClaimsProvider.js';
import {BaseCompositionRoot} from '../../plumbing/dependencies/baseCompositionRoot.js';
import {LoggerFactory} from '../../plumbing/logging/loggerFactory.js';
import {LoggerFactoryBuilder} from '../../plumbing/logging/loggerFactoryBuilder.js';
import {APIGatewayProxyExtendedEvent} from '../../plumbing/utilities/apiGatewayExtendedProxyEvent.js';
import {HttpProxy} from '../../plumbing/utilities/httpProxy.js';
import {ResponseWriter} from '../../plumbing/utilities/responseWriter.js';
import {Configuration} from '../configuration/configuration.js';
import {CompositionRoot} from '../dependencies/compositionRoot.js';

/*
 * A shorthand type for this module
 */
type AsyncHandler = (event: APIGatewayProxyExtendedEvent, context: Context) => Promise<APIGatewayProxyResult>;

/*
 * A class to configure the lambda and manage cross cutting concerns
 */
export class LambdaConfiguration {

    /*
     * Apply cross cutting concerns to a lambda
     */
    public async enrichHandler(baseHandler: AsyncHandler, parentContainer: Container)
        : Promise<middy.MiddyfiedHandler<APIGatewayProxyExtendedEvent, APIGatewayProxyResult> | AsyncHandler> {

        const loggerFactory = LoggerFactoryBuilder.create();
        try {

            // Load our JSON configuration
            const configuration = this.loadConfiguration();

            // Initialize the HTTP proxy object
            const httpProxy = new HttpProxy(configuration.api.useProxy, configuration.api.proxyUrl);
            await httpProxy.initialize();

            // Register common code dependencies for security, logging and error handling
            const base = new BaseCompositionRoot(parentContainer)
                .useLogging(configuration.logging, loggerFactory)
                .useOAuth(configuration.oauth)
                .withExtraClaimsProvider(new SampleExtraClaimsProvider(), configuration.cache)
                .useHttpProxy(httpProxy)
                .register();

            // Register API specific dependencies
            CompositionRoot.register(parentContainer);

            // Get framework middleware classes including the OAuth authorizer
            const childContainerMiddleware = base.getChildContainerMiddleware();
            const loggerMiddleware = base.getLoggerMiddleware();
            const exceptionMiddleware = base.getExceptionMiddleware();
            const authorizerMiddleware = base.getAuthorizerMiddleware();
            const customHeaderMiddleware = base.getCustomHeaderMiddleware();

            // Wrap the base handler and add middleware for cross cutting concerns
            return middy(async (event: APIGatewayProxyExtendedEvent, context: Context) => {
                return baseHandler(event, context);

            })
                // Handlers run in the reverse order listed here, so that exceptions are handled then logged
                .use(childContainerMiddleware)
                .use(loggerMiddleware)
                .use(exceptionMiddleware)
                .use(authorizerMiddleware)
                .use(customHeaderMiddleware);

        } catch (e) {

            // Handle any startup exceptions
            return this.handleStartupError(loggerFactory, e);
        }
    }

    /*
     * Load the configuration JSON file
     */
    private loadConfiguration(): Configuration {

        const configBuffer = fs.readFileSync('api.config.json');
        return JSON.parse(configBuffer.toString()) as Configuration;
    }

    /*
     * Ensure that any startup errors are logged and then return a handler that will provide the client response
     */
    private handleStartupError(loggerFactory: LoggerFactory, error: any): AsyncHandler {

        const clientError = loggerFactory.logStartupError(error);
        return async () => {
            return ResponseWriter.errorResponse(500, clientError);
        };
    }
}
