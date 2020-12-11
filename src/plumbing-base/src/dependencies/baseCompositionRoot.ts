import middy from '@middy/core';
import {Container} from 'inversify';
import {CoreApiClaims} from '../claims/coreApiClaims';
import {RequestContextAuthorizer} from '../claims/requestContextAuthorizer';
import {LoggingConfiguration} from '../configuration/loggingConfiguration';
import {BASETYPES} from '../dependencies/baseTypes';
import {LogEntry} from '../logging/LogEntry';
import {LoggerFactory} from '../logging/loggerFactory';
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl';
import {ExceptionMiddleware} from '../middleware/exceptionMiddleware';
import {LoggerMiddleware} from '../middleware/loggerMiddleware';
import { CustomHeaderMiddleware } from '../middleware/customHeaderMiddleware';

/*
 * Register dependencies to manage cross cutting concerns
 */
export class BaseCompositionRoot {

    // Constructor properties
    private readonly _container: Container;

    // Builder properties
    private _loggingConfiguration: LoggingConfiguration | null;
    private _loggerFactory: LoggerFactoryImpl | null;

    /*
     * Set initial values
     */
    public constructor(container: Container) {
        this._container = container;
        this._loggingConfiguration = null;
        this._loggerFactory = null;
    }

    /*
     * Receive logging configuration and use common code for logging and error handling
     */
    public useDiagnostics(
        loggingConfiguration: LoggingConfiguration,
        loggerFactory: LoggerFactory): BaseCompositionRoot {

        this._loggingConfiguration = loggingConfiguration;
        this._loggerFactory = loggerFactory as LoggerFactoryImpl;
        this._loggerFactory.configure(loggingConfiguration);
        return this;
    }

    /*
     * Register base framework dependencies
     */
    public register(): BaseCompositionRoot  {
        this._registerLoggingDependencies();
        this._registerClaimsDependencies();
        return this;
    }

    public getLoggerMiddleware(): middy.MiddlewareObject<any, any> {
        return new LoggerMiddleware(this._container, this._loggerFactory!);
    }

    public getExceptionMiddleware(): middy.MiddlewareObject<any, any> {
        return new ExceptionMiddleware(this._container, this._loggingConfiguration!);
    }

    public getRequestContextAuthorizer(): middy.MiddlewareObject<any, any> {
        return new RequestContextAuthorizer(this._container);
    }

    public getCustomHeaderMiddleware(): middy.MiddlewareObject<any, any> {
        return new CustomHeaderMiddleware(this._loggingConfiguration!.apiName);
    }

    /*
     * Register any common code logging dependencies
     */
    private _registerLoggingDependencies() {

        // This default per request object will be overridden at runtime
        this._container.bind<LogEntry>(BASETYPES.LogEntry).toConstantValue({} as any);
    }

    /*
     * Register any common code claims dependencies
     */
    private _registerClaimsDependencies() {

        // This default per request object will be overridden at runtime
        this._container.bind<CoreApiClaims>(BASETYPES.CoreApiClaims).toConstantValue({} as any);
    }
}
