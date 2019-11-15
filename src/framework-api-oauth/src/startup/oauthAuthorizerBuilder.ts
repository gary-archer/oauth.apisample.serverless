import {Container} from 'inversify';
import {MiddlewareObject} from 'middy';
import {CoreApiClaims} from '../../../framework-api-base';
import {ClaimsSupplier} from '../claims/claimsSupplier';
import {CustomClaimsProvider} from '../claims/customClaimsProvider';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {OAUTHINTERNALTYPES} from '../configuration/oauthInternalTypes';
import {OAUTHPUBLICTYPES} from '../configuration/oauthPublicTypes';
import {OAuthAuthenticator} from '../security/oauthAuthenticator';
import {OAuthAuthorizer} from '../security/oauthAuthorizer';
import {PolicyDocument} from '../utilities/policyDocument';

/*
 * Create the classes needed by our lambda authorizer
 */
export class OAuthAuthorizerBuilder<TClaims extends CoreApiClaims> {

    private readonly _container: Container;
    private readonly _configuration: OAuthConfiguration;
    private _claimsSupplier!: () => TClaims;
    private _customClaimsProviderSupplier!: () => CustomClaimsProvider<TClaims>;

    public constructor(container: Container, configuration: OAuthConfiguration) {
        this._container = container;
        this._configuration = configuration;
    }

    /*
     * Consumers of the builder class must provide a constructor function for creating claims
     */
    public withClaimsSupplier(construct: new () => TClaims): OAuthAuthorizerBuilder<TClaims> {
        this._claimsSupplier = () => new construct();
        return this;
    }

    /*
     * Consumers of the builder class can provide a constructor function for injecting custom claims
     */
    public withCustomClaimsProviderSupplier(construct: new () => CustomClaimsProvider<TClaims>)
            : OAuthAuthorizerBuilder<TClaims> {

        this._customClaimsProviderSupplier = () => new construct();
        return this;
    }

    /*
     * Register OAuth related dependencies needed for inversify to autowire types
     */
    public register(): OAuthAuthorizerBuilder<TClaims> {

        // Create an injectable object to enable the framework to create claims objects of a concrete type at runtime
        const claimsSupplier = ClaimsSupplier.createInstance<ClaimsSupplier<TClaims>, TClaims>(
            ClaimsSupplier,
            this._claimsSupplier,
            this._customClaimsProviderSupplier);

        // Register OAuth types
        this._container.bind<OAuthConfiguration>(OAUTHINTERNALTYPES.Configuration).toConstantValue(this._configuration);
        this._container.bind<OAuthAuthenticator>(OAUTHINTERNALTYPES.OAuthAuthenticator).to(OAuthAuthenticator);
        this._container.bind<ClaimsSupplier<TClaims>>(
            OAUTHINTERNALTYPES.ClaimsSupplier).toConstantValue(claimsSupplier);

        // Register a dummy value that is overridden by the authorizer middleware later
        // This prevents a 'Ambiguous match found for serviceIdentifier' error from inversify
        this._container.bind<PolicyDocument>(OAUTHPUBLICTYPES.PolicyDocument).toConstantValue({} as any);
        return this;
    }

    /*
     * Create the middleware which triggers the OAuth work
     */
    public createAuthorizer(): MiddlewareObject<any, any> {
        return new OAuthAuthorizer<TClaims>(this._container);
    }
}
