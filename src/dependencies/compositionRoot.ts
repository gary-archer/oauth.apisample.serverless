import {Container} from 'inversify';
import {Configuration} from '../configuration/configuration';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {INTERFACES} from '../dependencies/interfaces';
import {CompanyRepository} from '../logic/repositories/companyRepository';
import {CompanyService} from '../logic/services/companyService';
import {UserRepository} from '../logic/repositories/userRepository';
import {ClaimsCache} from '../middleware/claims/claimsCache';
import {ExtraClaimsProvider} from '../middleware/claims/extraClaimsProvider';
import {AccessTokenValidator} from '../middleware/oauth/accessTokenValidator';
import {JwksRetriever} from '../middleware/oauth/jwksRetriever';
import {OAuthFilter} from '../middleware/oauth/oauthFilter';
import {JsonFileReader} from '../utilities/jsonFileReader';

/*
 * A class to manage dependency injection composition at application startup
 */
export class CompositionRoot {

    private readonly parentContainer: Container;
    private configuration!: Configuration;

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
     * Do the main builder work of registering dependencies
     */
    public register(): CompositionRoot {

        this.registerOAuthDependencies();
        this.registerClaimsDependencies();
        this.registerApplicationDependencies();
        return this;
    }

    /*
     * Register dependencies used for OAuth handling
     */
    private registerOAuthDependencies() {

        // Make the configuration injectable
        this.parentContainer.bind<OAuthConfiguration>(INTERFACES.OAuthConfiguration)
            .toConstantValue(this.configuration.oauth);

        // Register an object to validate JWT access tokens
        this.parentContainer.bind(AccessTokenValidator)
            .toSelf().inTransientScope();

        // The filter deals with finalizing the claims principal
        this.parentContainer.bind(OAuthFilter)
            .toSelf().inTransientScope();

        // Also register a singleton to cache token signing public keys
        this.parentContainer.bind(JwksRetriever)
            .toConstantValue(new JwksRetriever(this.configuration.oauth));

        return this;
    }

    /*
     * Register injectable items used for claims processing
     */
    private registerClaimsDependencies() {

        // Register the singleton cache
        const claimsCache = new ClaimsCache(this.configuration.oauth.claimsCacheTimeToLiveMinutes);
        this.parentContainer.bind(ClaimsCache)
            .toConstantValue(claimsCache);

        // Register the extra claims provider
        this.parentContainer.bind(ExtraClaimsProvider)
            .toSelf().inTransientScope();
    }

    /*
     * Register objects used by application logic
     */
    private registerApplicationDependencies(): void {

        this.parentContainer.bind(CompanyService)
            .toSelf().inTransientScope();
        this.parentContainer.bind(CompanyRepository)
            .toSelf().inTransientScope();
        this.parentContainer.bind(UserRepository)
            .toSelf().inTransientScope();
        this.parentContainer.bind(JsonFileReader)
            .toSelf().inTransientScope();
    }
}
