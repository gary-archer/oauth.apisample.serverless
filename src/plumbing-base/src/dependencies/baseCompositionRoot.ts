import middy from '@middy/core';
import {Container} from 'inversify';
import {BaseClaims} from '../claims/baseClaims';
import {CustomClaims} from '../claims/customClaims';
import {UserInfoClaims} from '../claims/userInfoClaims';
import {LoggingConfiguration} from '../configuration/loggingConfiguration';
import {BASETYPES} from '../dependencies/baseTypes';
import {LogEntry} from '../logging/LogEntry';
import {LoggerFactory} from '../logging/loggerFactory';
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl';
import {CustomHeaderMiddleware} from '../middleware/customHeaderMiddleware';
import {ExceptionMiddleware} from '../middleware/exceptionMiddleware';
import {LoggerMiddleware} from '../middleware/loggerMiddleware';
import {HttpProxy} from '../utilities/httpProxy';

/*
 * Register dependencies to manage cross cutting concerns
 */
export class BaseCompositionRoot {

    private readonly _container: Container;
    private _loggingConfiguration: LoggingConfiguration | null;
    private _loggerFactory: LoggerFactoryImpl | null;
    private _httpProxy: HttpProxy | null;

    public constructor(container: Container) {
        this._container = container;
        this._loggingConfiguration = null;
        this._loggerFactory = null;
        this._httpProxy = null;
    }

    /*
     * Receive logging configuration and use common code for logging and error handling
     */
    public useLogging(
        loggingConfiguration: LoggingConfiguration,
        loggerFactory: LoggerFactory): BaseCompositionRoot {

        this._loggingConfiguration = loggingConfiguration;
        this._loggerFactory = loggerFactory as LoggerFactoryImpl;
        this._loggerFactory.configure(loggingConfiguration);
        return this;
    }

    /*
     * Receive the HTTP proxy object, which is only used on a developer PC
     */
    public useHttpProxy(httpProxy: HttpProxy): BaseCompositionRoot {
        this._httpProxy = httpProxy;
        return this;
    }

    /*
     * Register base framework dependencies
     */
    public register(): BaseCompositionRoot {

        this._registerBaseDependencies();
        this._registerClaimsDependencies();
        return this;
    }

    public getLoggerMiddleware(): middy.MiddlewareObject<any, any> {
        return new LoggerMiddleware(this._container, this._loggerFactory!);
    }

    public getExceptionMiddleware(): middy.MiddlewareObject<any, any> {
        return new ExceptionMiddleware(this._container, this._loggingConfiguration!);
    }

    public getCustomHeaderMiddleware(): middy.MiddlewareObject<any, any> {
        return new CustomHeaderMiddleware(this._loggingConfiguration!.apiName);
    }

    /*
     * Register any common code logging dependencies
     */
    private _registerBaseDependencies() {

        // This default per request object will be overridden at runtime
        this._container.bind<LogEntry>(BASETYPES.LogEntry).toConstantValue({} as any);

        // The proxy object is a singleton
        this._container.bind<HttpProxy>(BASETYPES.HttpProxy).toConstantValue(this._httpProxy!);
    }

    /*
     * Register injectable items used for claims processing
     */
    private _registerClaimsDependencies() {

        // These default per request objects will be overridden at runtime
        this._container.bind<BaseClaims>(BASETYPES.BaseClaims).toConstantValue({} as any);
        this._container.bind<UserInfoClaims>(BASETYPES.UserInfoClaims).toConstantValue({} as any);
        this._container.bind<CustomClaims>(BASETYPES.CustomClaims).toConstantValue({} as any);
    }
}
