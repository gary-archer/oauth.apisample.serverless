import {Context} from 'aws-lambda';
import {Container} from 'inversify';
import middy from 'middy';
import {Middy} from 'middy';
import {BASEFRAMEWORKTYPES, LogEntry} from '../../framework-base';
import {FrameworkConfiguration} from '../configuration/frameworkConfiguration';
import {ExceptionMiddleware} from '../errors/exceptionMiddleware';
import {LogEntryImpl} from '../logging/logEntryImpl';
import {LoggerFactory} from '../logging/loggerFactory';
import {RequestLoggerMiddleware} from '../logging/requestLoggerMiddleware';
import {CustomHeaderMiddleware} from '../middleware/customHeaderMiddleware';
import {AsyncHandler} from '../utilities/asyncHandler';

/*
 * A builder style class to configure framework behaviour and to register its dependencies
 */
export class FrameworkBuilder {

    private readonly _container: Container;
    private readonly _configuration: FrameworkConfiguration;
    private readonly _loggerFactory: LoggerFactory;

    public constructor(container: Container, configuration: FrameworkConfiguration, loggerFactory: LoggerFactory) {
        this._container = container;
        this._configuration = configuration;
        this._loggerFactory = loggerFactory;
    }

    /*
     * Add framework dependencies to the container
     */
    public register(): FrameworkBuilder {
        this._container.bind<LogEntry>(BASEFRAMEWORKTYPES.LogEntry).toConstantValue(new LogEntryImpl());
        return this;
    }

    /*
     * Wrap the base handler in cross cutting middleware using the middy component
     */
    public configureMiddleware(baseHandler: AsyncHandler, isLambdaAuthorizer: boolean): Middy<any, any> {

        // Wrap the base handler and add middleware for cross cutting concerns
        // Logging and error handling are injected first so that they work in other middleware classes
        const wrappedHandler = middy(async (event: any, context: Context) => {
            return await baseHandler(event, context);

        })
        .use(new ExceptionMiddleware())
        .use(new RequestLoggerMiddleware(this._container))
        .use(new CustomHeaderMiddleware(isLambdaAuthorizer));

        // Return the base handler wrapped in cross cutting concerns
        return wrappedHandler;
    }
}
