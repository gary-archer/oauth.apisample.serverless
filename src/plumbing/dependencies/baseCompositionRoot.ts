import middy from '@middy/core';
import {Container} from 'inversify';
import {Cache} from '../cache/cache.js';
import {AwsCache} from '../cache/awsCache.js';
import {NullCache} from '../cache/nullCache.js';
import {ClaimsPrincipal} from '../claims/claimsPrincipal.js';
import {CustomClaimsProvider} from '../claims/customClaimsProvider.js';
import {CacheConfiguration} from '../configuration/cacheConfiguration.js';
import {LoggingConfiguration} from '../configuration/loggingConfiguration.js';
import {OAuthConfiguration} from '../configuration/oauthConfiguration.js';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {LogEntry} from '../logging/logEntry.js';
import {LoggerFactory} from '../logging/loggerFactory.js';
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl.js';
import {AuthorizerMiddleware} from '../middleware/authorizerMiddleware.js';
import {CustomHeaderMiddleware} from '../middleware/customHeaderMiddleware.js';
import {ExceptionMiddleware} from '../middleware/exceptionMiddleware.js';
import {LoggerMiddleware} from '../middleware/loggerMiddleware.js';
import {AccessTokenValidator} from '../oauth/accessTokenValidator.js';
import {JwksRetriever} from '../oauth/jwksRetriever.js';
import {OAuthAuthorizer} from '../oauth/oauthAuthorizer.js';
import {HttpProxy} from '../utilities/httpProxy.js';

/*
 * Register dependencies to manage cross cutting concerns
 */
export class BaseCompositionRoot {

    private readonly _container: Container;

    private _loggingConfiguration: LoggingConfiguration | null;
    private _oauthConfiguration: OAuthConfiguration | null;
    private _customClaimsProvider: CustomClaimsProvider | null;
    private _cacheConfiguration: CacheConfiguration | null;
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
     * Indicate that we're using accepting OAuth access tokens
     */
    public useOAuth(oauthConfiguration: OAuthConfiguration): BaseCompositionRoot {

        this._oauthConfiguration = oauthConfiguration;
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

        this._cache = configuration.isActive ?
            new AwsCache(this._cacheConfiguration, this._customClaimsProvider) :
            new NullCache();

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

    public getLoggerMiddleware(): middy.MiddlewareObj<any, any> {
        return new LoggerMiddleware(this._container, this._loggerFactory!);
    }

    public getExceptionMiddleware(): middy.MiddlewareObj<any, any> {
        return new ExceptionMiddleware(this._container, this._loggingConfiguration!);
    }

    public getCustomHeaderMiddleware(): middy.MiddlewareObj<any, any> {
        return new CustomHeaderMiddleware(this._loggingConfiguration!.apiName);
    }

    public getAuthorizerMiddleware(): middy.MiddlewareObj<any, any> {
        return new AuthorizerMiddleware(this._container);
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

        // Register the singleton cache
        this._container.bind<Cache>(BASETYPES.Cache).toConstantValue(this._cache!);

        // Register the custom claims provider
        this._container.bind<CustomClaimsProvider>(BASETYPES.CustomClaimsProvider)
            .toConstantValue(this._customClaimsProvider!);

        // The per request claims principal is given a dummy value here and then updated at runtime
        this._container.bind<ClaimsPrincipal>(BASETYPES.ClaimsPrincipal).toConstantValue({} as any);
    }

    /*
     * Register dependencies used for OAuth handling
     */
    private _registerOAuthDependencies() {

        // Register singletons
        this._container.bind<OAuthConfiguration>(BASETYPES.OAuthConfiguration)
            .toConstantValue(this._oauthConfiguration!);

        // Every request retrieves cached token signing public keys from the cache
        this._container.bind<JwksRetriever>(BASETYPES.JwksRetriever)
            .to(JwksRetriever).inTransientScope();

        // Every request verifies a JWT access token
        this._container.bind<AccessTokenValidator>(BASETYPES.AccessTokenValidator)
            .to(AccessTokenValidator).inTransientScope();

        // Every request does extra work to form a claims principal
        this._container.bind<OAuthAuthorizer>(BASETYPES.OAuthAuthorizer)
            .to(OAuthAuthorizer).inTransientScope();

        return this;
    }
}
