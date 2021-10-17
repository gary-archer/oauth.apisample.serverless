import middy from '@middy/core';
import {Container} from 'inversify';
import {Cache} from '../cache/cache';
import {AwsCache} from '../cache/awsCache';
import {DevelopmentCache} from '../cache/developmentCache';
import {BaseClaims} from '../claims/baseClaims';
import {CustomClaims} from '../claims/customClaims';
import {CustomClaimsProvider} from '../claims/customClaimsProvider';
import {UserInfoClaims} from '../claims/userInfoClaims';
import {CacheConfiguration} from '../configuration/cacheConfiguration';
import {LoggingConfiguration} from '../configuration/loggingConfiguration';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {BASETYPES} from '../dependencies/baseTypes';
import {LogEntry} from '../logging/logEntry';
import {LoggerFactory} from '../logging/loggerFactory';
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl';
import {CustomHeaderMiddleware} from '../middleware/customHeaderMiddleware';
import {ExceptionMiddleware} from '../middleware/exceptionMiddleware';
import {LoggerMiddleware} from '../middleware/loggerMiddleware';
import {AccessTokenRetriever} from '../oauth/accessTokenRetriever';
import {JwksRetriever} from '../oauth/jwksRetriever';
import {OAuthAuthenticator} from '../oauth/oauthAuthenticator';
import {OAuthAuthorizer} from '../oauth/oauthAuthorizer';
import {HttpProxy} from '../utilities/httpProxy';

/*
 * Register dependencies to manage cross cutting concerns
 */
export class BaseCompositionRoot {

    private readonly _container: Container;
    private _loggingConfiguration: LoggingConfiguration | null;
    private _oauthConfiguration: OAuthConfiguration | null;
    private _cacheConfiguration: CacheConfiguration | null;
    private _customClaimsProvider: CustomClaimsProvider | null;
    private _cache: Cache | null;
    private _loggerFactory: LoggerFactoryImpl | null;
    private _httpProxy: HttpProxy | null;

    public constructor(container: Container) {
        this._container = container;
        this._loggingConfiguration = null;
        this._oauthConfiguration = null;
        this._cacheConfiguration = null;
        this._loggerFactory = null;
        this._customClaimsProvider = null;
        this._cache = null;
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
     * Indicate that we're using OAuth and receive the configuration
     */
    public useOAuth(configuration: OAuthConfiguration): BaseCompositionRoot {

        this._oauthConfiguration = configuration;
        return this;
    }

    /*
     * Deal with custom claims
     */
    public withCustomClaimsProvider(
        provider: CustomClaimsProvider,
        configuration: CacheConfiguration) : BaseCompositionRoot {

        this._customClaimsProvider = provider;
        this._cacheConfiguration = configuration;

        this._cache = process.env.IS_LOCAL === 'true'?
            new DevelopmentCache():
            new AwsCache(this._cacheConfiguration, this._customClaimsProvider);

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
        this._registerOAuthDependencies();
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

    public getAuthorizerMiddleware(): middy.MiddlewareObject<any, any> {
        return new OAuthAuthorizer(this._container, this._customClaimsProvider!, this._cache!);
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

        // Create the cache
        this._container.bind<Cache>(BASETYPES.Cache).toConstantValue(this._cache!);

        // These default per request objects will be overridden at runtime
        this._container.bind<BaseClaims>(BASETYPES.BaseClaims).toConstantValue({} as any);
        this._container.bind<UserInfoClaims>(BASETYPES.UserInfoClaims).toConstantValue({} as any);
        this._container.bind<CustomClaims>(BASETYPES.CustomClaims).toConstantValue({} as any);
    }

    /*
     * Register dependencies used for OAuth handling
     */
    private _registerOAuthDependencies() {

        // Register singletons
        this._container.bind<OAuthConfiguration>(BASETYPES.OAuthConfiguration)
            .toConstantValue(this._oauthConfiguration!);

        // Register per request objects
        this._container.bind<AccessTokenRetriever>(BASETYPES.AccessTokenRetriever)
            .to(AccessTokenRetriever).inTransientScope();
        this._container.bind<JwksRetriever>(BASETYPES.JwksRetriever)
            .to(JwksRetriever).inTransientScope();
        this._container.bind<OAuthAuthenticator>(BASETYPES.OAuthAuthenticator)
            .to(OAuthAuthenticator).inTransientScope();

        return this;
    }
}
