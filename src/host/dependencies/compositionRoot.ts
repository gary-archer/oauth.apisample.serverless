import {Container} from 'inversify';
import {APPLICATIONTYPES} from '../../logic/dependencies/applicationTypes';
import {CompanyRepository} from '../../logic/repositories/companyRepository';
import {UserRepository} from '../../logic/repositories/userRepository';
import {CompanyService} from '../../logic/services/companyService';
import {JsonFileReader} from '../../logic/utilities/jsonFileReader';
import {ClaimsCache} from '../../plumbing/claims/claimsCache';
import {ExtraClaimsProvider} from '../../plumbing/claims/extraClaimsProvider';
import {OAuthConfiguration} from '../../plumbing/configuration/oauthConfiguration';
import {BASETYPES} from '../../plumbing/dependencies/baseTypes';
import {AccessTokenValidator} from '../../plumbing/oauth/accessTokenValidator';
import {JwksRetriever} from '../../plumbing/oauth/jwksRetriever';
import {OAuthFilter} from '../../plumbing/oauth/oauthFilter';
import {HttpProxy} from '../../plumbing/utilities/httpProxy';
import {Configuration} from '../configuration/configuration';

/*
 * A class to manage dependency injection composition at application startup
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
export class CompositionRoot {

    private readonly parentContainer: Container;
    private configuration!: Configuration;
    private httpProxy!: HttpProxy;
    private extraClaimsProvider!: ExtraClaimsProvider;

    /*
     * Receive the DI container
     */
    public constructor(parentContainer: Container) {
        this.parentContainer = parentContainer;
    }

    /*
     * Receive configuration
     */
    public addConfiguration(configuration: Configuration): CompositionRoot {

        this.configuration = configuration;
        return this;
    }

    /*
     * Receive an object that customizes the claims principal
     */
    public addExtraClaimsProvider(provider: ExtraClaimsProvider) : CompositionRoot {
        this.extraClaimsProvider = provider;
        return this;
    }

    /*
     * Store an object to manage HTTP debugging
     */
    public addHttpProxy(httpProxy: HttpProxy): CompositionRoot {
        this.httpProxy = httpProxy;
        return this;
    }

    /*
     * Do the main builder work of registering dependencies
     */
    public register(): CompositionRoot {

        this.registerBaseDependencies();
        this.registerOAuthDependencies();
        this.registerClaimsDependencies();
        this.registerApplicationDependencies();
        return this;
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
            .toConstantValue(this.configuration.oauth);

        // Register an object to validate JWT access tokens
        this.parentContainer.bind<AccessTokenValidator>(BASETYPES.AccessTokenValidator)
            .to(AccessTokenValidator).inTransientScope();

        // The filter deals with finalizing the claims principal
        this.parentContainer.bind<OAuthFilter>(BASETYPES.OAuthFilter)
            .to(OAuthFilter).inTransientScope();

        // Also register a singleton to cache token signing public keys
        this.parentContainer.bind<JwksRetriever>(BASETYPES.JwksRetriever)
            .toConstantValue(new JwksRetriever(this.configuration.oauth, this.httpProxy));

        return this;
    }

    /*
     * Register injectable items used for claims processing
     */
    private registerClaimsDependencies() {

        // Register the singleton cache
        const claimsCache = new ClaimsCache(this.configuration.oauth.claimsCacheTimeToLiveMinutes);
        this.parentContainer.bind<ClaimsCache>(BASETYPES.ClaimsCache)
            .toConstantValue(claimsCache);

        // Register the extra claims provider
        this.parentContainer.bind<ExtraClaimsProvider>(BASETYPES.ExtraClaimsProvider)
            .toConstantValue(this.extraClaimsProvider);
    }

    /*
     * Register objects used by application logic
     */
    private registerApplicationDependencies(): void {

        this.parentContainer.bind<CompanyService>(APPLICATIONTYPES.CompanyService)
            .to(CompanyService).inTransientScope();
        this.parentContainer.bind<CompanyRepository>(APPLICATIONTYPES.CompanyRepository)
            .to(CompanyRepository).inTransientScope();
        this.parentContainer.bind<UserRepository>(APPLICATIONTYPES.UserRepository)
            .to(UserRepository).inTransientScope();
        this.parentContainer.bind<JsonFileReader>(APPLICATIONTYPES.JsonFileReader)
            .to(JsonFileReader).inTransientScope();
    }
}
