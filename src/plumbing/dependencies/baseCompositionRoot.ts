import middy from '@middy/core';
import {Container} from 'inversify';
import {ClaimsCache} from '../claims/claimsCache.js';
import {ExtraClaimsProvider} from '../claims/extraClaimsProvider.js';
import {LoggingConfiguration} from '../configuration/loggingConfiguration.js';
import {OAuthConfiguration} from '../configuration/oauthConfiguration.js';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {LoggerFactory} from '../logging/loggerFactory.js';
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl.js';
import {AuthorizerMiddleware} from '../middleware/authorizerMiddleware.js';
import {ChildContainerMiddleware} from '../middleware/childContainerMiddleware.js';
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

    private readonly parentContainer: Container;
    private oauthConfiguration: OAuthConfiguration | null;
    private extraClaimsProvider: ExtraClaimsProvider | null;
    private loggingConfiguration: LoggingConfiguration | null;
    private loggerFactory: LoggerFactoryImpl | null;
    private httpProxy: HttpProxy | null;

    public constructor(parentContainer: Container) {

        this.parentContainer = parentContainer;
        this.oauthConfiguration = null;
        this.extraClaimsProvider = null;
        this.loggingConfiguration = null;
        this.loggerFactory = null;
        this.httpProxy = null;
    }

    /*
     * Indicate that we're using accepting OAuth access tokens
     */
    public useOAuth(oauthConfiguration: OAuthConfiguration): BaseCompositionRoot {

        this.oauthConfiguration = oauthConfiguration;
        return this;
    }

    /*
     * An object to provide extra claims when a new token is processed
     */
    public withExtraClaimsProvider(provider: ExtraClaimsProvider) : BaseCompositionRoot {
        this.extraClaimsProvider = provider;
        return this;
    }

    /*
     * Receive the logging configuration so that we can create objects related to logging and error handling
     */
    public withLogging(
        loggingConfiguration: LoggingConfiguration,
        loggerFactory: LoggerFactory): BaseCompositionRoot {

        this.loggingConfiguration = loggingConfiguration;
        this.loggerFactory = loggerFactory as LoggerFactoryImpl;
        this.loggerFactory.configure(loggingConfiguration);
        return this;
    }

    /*
     * Apply HTTP proxy details for outgoing OAuth calls if configured
     */
    public withHttpProxy(httpProxy: HttpProxy): BaseCompositionRoot {
        this.httpProxy = httpProxy;
        return this;
    }

    /*
     * Register base framework dependencies
     */
    public register(): BaseCompositionRoot {

        this.registerBaseDependencies();
        this.registerOAuthDependencies();
        this.registerClaimsDependencies();
        return this;
    }

    public getChildContainerMiddleware(): middy.MiddlewareObj<any, any> {
        return new ChildContainerMiddleware(this.parentContainer);
    }

    public getLoggerMiddleware(): middy.MiddlewareObj<any, any> {
        return new LoggerMiddleware(this.loggerFactory!);
    }

    public getExceptionMiddleware(): middy.MiddlewareObj<any, any> {
        return new ExceptionMiddleware(this.loggingConfiguration!);
    }

    public getCustomHeaderMiddleware(): middy.MiddlewareObj<any, any> {
        return new CustomHeaderMiddleware(this.loggingConfiguration!.apiName);
    }

    public getAuthorizerMiddleware(): middy.MiddlewareObj<any, any> {
        return new AuthorizerMiddleware();
    }

    /*
     * Register any common dependencies
     */
    private registerBaseDependencies() {

        this.parentContainer.bind<HttpProxy>(BASETYPES.HttpProxy).toConstantValue(this.httpProxy!);
    }

    /*
     * Register dependencies used for OAuth handling
     */
    private registerOAuthDependencies() {

        // Make the configuration injectable
        this.parentContainer.bind<OAuthConfiguration>(BASETYPES.OAuthConfiguration)
            .toConstantValue(this.oauthConfiguration!);

        // Register an object to validate JWT access tokens
        this.parentContainer.bind<AccessTokenValidator>(BASETYPES.AccessTokenValidator)
            .to(AccessTokenValidator).inTransientScope();

        // The filter deals with finalizing the claims principal
        this.parentContainer.bind<OAuthFilter>(BASETYPES.OAuthFilter)
            .to(OAuthFilter).inTransientScope();

        // Also register a singleton to cache token signing public keys
        this.parentContainer.bind<JwksRetriever>(BASETYPES.JwksRetriever)
            .toConstantValue(new JwksRetriever(this.oauthConfiguration!, this.httpProxy!));

        return this;
    }

    /*
     * Register injectable items used for claims processing
     */
    private registerClaimsDependencies() {

        // Register the singleton cache
        const claimsCache = new ClaimsCache(
            this.oauthConfiguration!.claimsCacheTimeToLiveMinutes,
            this.extraClaimsProvider!);
        this.parentContainer.bind<ClaimsCache>(BASETYPES.ClaimsCache)
            .toConstantValue(claimsCache);

        // Register the extra claims provider
        this.parentContainer.bind<ExtraClaimsProvider>(BASETYPES.ExtraClaimsProvider)
            .toConstantValue(this.extraClaimsProvider!);
    }
}
