import middy from '@middy/core';
import {Container} from 'inversify';
import {CustomClaims} from '../claims/customClaims';
import {TokenClaims} from '../claims/tokenClaims';
import {UserInfoClaims} from '../claims/userInfoClaims';
import {LoggingConfiguration} from '../configuration/loggingConfiguration';
import {BASETYPES} from '../dependencies/baseTypes';
import {LogEntry} from '../logging/LogEntry';
import {LoggerFactory} from '../logging/loggerFactory';
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl';
import {CustomHeaderMiddleware} from '../middleware/customHeaderMiddleware';
import {ExceptionMiddleware} from '../middleware/exceptionMiddleware';
import {LoggerMiddleware} from '../middleware/loggerMiddleware';
import {RequestContextAuthorizer} from '../security/requestContextAuthorizer';

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

    public getRequestContextAuthorizer(
        claimsDeserializer: (data: any) => CustomClaims): middy.MiddlewareObject<any, any> {

        return new RequestContextAuthorizer(this._container, claimsDeserializer);
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
     * Register inkectable items used for claims processing
     */
    private _registerClaimsDependencies() {

        // These default per request objects will be overridden at runtime
        this._container.bind<TokenClaims>(BASETYPES.TokenClaims).toConstantValue({} as any);
        this._container.bind<UserInfoClaims>(BASETYPES.UserInfoClaims).toConstantValue({} as any);
        this._container.bind<CustomClaims>(BASETYPES.CustomClaims).toConstantValue({} as any);
    }
}
