import middy from '@middy/core';
import {Container} from 'inversify';
import {Cache} from '../cache/cache.js';
import {AwsCache} from '../cache/awsCache.js';
import {NullCache} from '../cache/nullCache.js';
import {ExtraClaimsProvider} from '../claims/extraClaimsProvider.js';
import {CacheConfiguration} from '../configuration/cacheConfiguration.js';
import {LoggingConfiguration} from '../configuration/loggingConfiguration.js';
import {OAuthConfiguration} from '../configuration/oauthConfiguration.js';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {LoggerFactory} from '../logging/loggerFactory.js';
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl.js';
import {AuthorizerMiddleware} from '../middleware/authorizerMiddleware.js';
import {CustomHeaderMiddleware} from '../middleware/customHeaderMiddleware.js';
import {ExceptionMiddleware} from '../middleware/exceptionMiddleware.js';
import {LoggerMiddleware} from '../middleware/loggerMiddleware.js';
import {AccessTokenValidator} from '../oauth/accessTokenValidator.js';
import {JwksRetriever} from '../oauth/jwksRetriever.js';
import {OAuthFilter} from '../oauth/oauthFilter.js';
import {HttpProxy} from '../utilities/httpProxy.js';

/*
 * Register dependencies to manage cross cutting concerns
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
export class BaseCompositionRoot {

    private readonly container: Container;
    private loggingConfiguration: LoggingConfiguration | null;
    private oauthConfiguration: OAuthConfiguration | null;
    private extraClaimsProvider: ExtraClaimsProvider | null;
    private cacheConfiguration: CacheConfiguration | null;
    private cache: Cache | null;
    private loggerFactory: LoggerFactoryImpl | null;
    private httpProxy: HttpProxy | null;

    public constructor(container: Container) {

        this.container = container;
        this.loggingConfiguration = null;
        this.oauthConfiguration = null;
        this.cacheConfiguration = null;
        this.loggerFactory = null;
        this.extraClaimsProvider = null;
        this.cache = null;
        this.httpProxy = null;
    }

    /*
     * Receive logging configuration and use common code for logging and error handling
     */
    public useLogging(
        loggingConfiguration: LoggingConfiguration,
        loggerFactory: LoggerFactory): BaseCompositionRoot {

        this.loggingConfiguration = loggingConfiguration;
        this.loggerFactory = loggerFactory as LoggerFactoryImpl;
        this.loggerFactory.configure(loggingConfiguration);
        return this;
    }

    /*
     * Indicate that we're using accepting OAuth access tokens
     */
    public useOAuth(oauthConfiguration: OAuthConfiguration): BaseCompositionRoot {

        this.oauthConfiguration = oauthConfiguration;
        return this;
    }

    /*
     * Deal with extra claims
     */
    public withExtraClaimsProvider(
        provider: ExtraClaimsProvider,
        configuration: CacheConfiguration) : BaseCompositionRoot {

        this.extraClaimsProvider = provider;
        this.cacheConfiguration = configuration;

        this.cache = configuration.isActive ?
            new AwsCache(this.cacheConfiguration, this.extraClaimsProvider) :
            new NullCache();

        return this;
    }

    /*
     * Receive the HTTP proxy object, which is only used on a developer PC
     */
    public useHttpProxy(httpProxy: HttpProxy): BaseCompositionRoot {
        this.httpProxy = httpProxy;
        return this;
    }

    /*
     * Register base framework dependencies
     */
    public register(): BaseCompositionRoot {

        this.registerBaseDependencies();
        this.registerClaimsDependencies();
        this.registerOAuthDependencies();
        return this;
    }

    public getLoggerMiddleware(): middy.MiddlewareObj<any, any> {
        return new LoggerMiddleware(this.container, this.loggerFactory!);
    }

    public getExceptionMiddleware(): middy.MiddlewareObj<any, any> {
        return new ExceptionMiddleware(this.container, this.loggingConfiguration!);
    }

    public getCustomHeaderMiddleware(): middy.MiddlewareObj<any, any> {
        return new CustomHeaderMiddleware(this.loggingConfiguration!.apiName);
    }

    public getAuthorizerMiddleware(): middy.MiddlewareObj<any, any> {
        return new AuthorizerMiddleware(this.container);
    }

    /*
     * Register any common code logging dependencies
     */
    private registerBaseDependencies() {

        // The proxy object is a singleton
        this.container.bind<HttpProxy>(BASETYPES.HttpProxy).toConstantValue(this.httpProxy!);
    }

    /*
     * Register injectable items used for claims processing
     */
    private registerClaimsDependencies() {

        // Register the singleton cache
        this.container.bind<Cache>(BASETYPES.Cache).toConstantValue(this.cache!);

        // Register the extra claims provider
        this.container.bind<ExtraClaimsProvider>(BASETYPES.ExtraClaimsProvider)
            .toConstantValue(this.extraClaimsProvider!);
    }

    /*
     * Register dependencies used for OAuth handling
     */
    private registerOAuthDependencies() {

        // Register singletons
        this.container.bind<OAuthConfiguration>(BASETYPES.OAuthConfiguration)
            .toConstantValue(this.oauthConfiguration!);

        // Every request retrieves cached token signing public keys from the cache
        this.container.bind<JwksRetriever>(BASETYPES.JwksRetriever)
            .to(JwksRetriever).inTransientScope();

        // Every request verifies a JWT access token
        this.container.bind<AccessTokenValidator>(BASETYPES.AccessTokenValidator)
            .to(AccessTokenValidator).inTransientScope();

        // Every request does extra work to form a claims principal
        this.container.bind<OAuthFilter>(BASETYPES.OAuthFilter)
            .to(OAuthFilter).inTransientScope();

        return this;
    }
}
