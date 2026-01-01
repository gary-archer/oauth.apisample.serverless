import middy from '@middy/core';
import {APIGatewayProxyResult, Context} from 'aws-lambda';
import {Container} from 'inversify';
import fs from 'node:fs/promises';
import {ExtraClaimsProviderImpl} from '../../logic/claims/extraClaimsProviderImpl';
import {LoggerFactoryImpl} from '../../plumbing/logging/loggerFactoryImpl';
import {AuthenticationMiddleware} from '../../plumbing/middleware/authenticationMiddleware';
import {ChildContainerMiddleware} from '../../plumbing/middleware/childContainerMiddleware';
import {CustomHeaderMiddleware} from '../../plumbing/middleware/customHeaderMiddleware';
import {ExceptionMiddleware} from '../../plumbing/middleware/exceptionMiddleware';
import {LoggerMiddleware} from '../../plumbing/middleware/loggerMiddleware';
import {APIGatewayProxyExtendedEvent} from '../../plumbing/utilities/apiGatewayExtendedProxyEvent';
import {HttpProxy} from '../../plumbing/utilities/httpProxy';
import {ResponseWriter} from '../../plumbing/utilities/responseWriter';
import {Configuration} from '../configuration/configuration';
import {CompositionRoot} from '../dependencies/compositionRoot';

/*
 * A shorthand for the lambda handler method signature
 */
type LambdaHandler = (event: APIGatewayProxyExtendedEvent, context: Context) => Promise<APIGatewayProxyResult>;

/*
 * Each instance of the lambda receives multiple HTTP requests
 */
export class LambdaInstance {

    /*
     * Enrich the base handler with middleware to manage cross cutting concerns
     */
    public async prepare(baseHandler: LambdaHandler)
        : Promise<middy.MiddyfiedHandler<APIGatewayProxyExtendedEvent, APIGatewayProxyResult> | LambdaHandler> {

        const loggerFactory = new LoggerFactoryImpl();
        try {

            // Load configuration and configure logging
            const configuration = await this.loadConfiguration();
            loggerFactory.configure(configuration.logging);

            // Create a parent container to manage dependencies and lifetimes
            const parentContainer = new Container();

            // Initialize the HTTP proxy object
            const httpProxy = new HttpProxy(configuration.api.useProxy, configuration.api.proxyUrl);
            await httpProxy.initialize();

            // Register dependencies with the container
            new CompositionRoot(parentContainer)
                .addConfiguration(configuration)
                .addHttpProxy(httpProxy)
                .addExtraClaimsProvider(new ExtraClaimsProviderImpl())
                .register();

            // Create middleware objects
            const childContainerMiddleware = new ChildContainerMiddleware(parentContainer);
            const loggerMiddleware = new LoggerMiddleware(loggerFactory);
            const exceptionMiddleware = new ExceptionMiddleware(
                loggerFactory,
                configuration.logging,
                configuration.oauth);
            const authenticationMiddleware = new AuthenticationMiddleware(configuration.oauth);
            const customHeaderMiddleware = new CustomHeaderMiddleware(configuration.logging.apiName);

            // Wrap the base handler with middleware that runs in the following sequence
            return middy(async (event: APIGatewayProxyExtendedEvent, context: Context) => {
                return baseHandler(event, context);

            })
                .use(childContainerMiddleware)
                .use(loggerMiddleware)
                .use(exceptionMiddleware)
                .use(authenticationMiddleware)
                .use(customHeaderMiddleware);

        } catch (e) {

            // Handle any startup exceptions
            return this.handleStartupError(loggerFactory, e);
        }
    }

    /*
     * Load the configuration JSON file
     */
    private async loadConfiguration(): Promise<Configuration> {

        const configJson = await fs.readFile('api.config.json', 'utf8');
        return JSON.parse(configJson) as Configuration;
    }

    /*
     * Ensure that any startup errors are logged and then return a handler that will provide the client response
     */
    private handleStartupError(loggerFactory: LoggerFactoryImpl, error: any): LambdaHandler {

        const clientError = loggerFactory.logStartupError(error);
        return async () => {
            return ResponseWriter.startupErrorResponse(500, clientError);
        };
    }
}
