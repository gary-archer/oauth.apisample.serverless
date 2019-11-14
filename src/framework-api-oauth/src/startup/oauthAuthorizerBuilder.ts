import {Container} from 'inversify';
import {MiddlewareObject} from 'middy';
import {CoreApiClaims} from '../../../framework-api-base';
import {ClaimsSupplier} from '../claims/claimsSupplier';
import {CustomClaimsProvider} from '../claims/customClaimsProvider';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {OAUTHINTERNALTYPES} from '../configuration/oauthInternalTypes';
import {OAuthAuthenticator} from '../security/oauthAuthenticator';
import {OAuthAuthorizer} from '../security/oauthAuthorizer';
import {OAuthAuthorizerMiddleware} from '../security/oauthAuthorizerMiddleware';

/*
 * A factory class that runs at lambda startup to set up
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
        this._container.bind<OAuthAuthorizer<TClaims>>(OAUTHINTERNALTYPES.OAuthAuthorizer).to(OAuthAuthorizer);
        this._container.bind<ClaimsSupplier<TClaims>>(OAUTHINTERNALTYPES.ClaimsSupplier).toConstantValue(claimsSupplier);
        return this;
    }

    /*
     * Create the middleware which triggers the OAuth work
     */
    public createMiddleware(): MiddlewareObject<any, any> {
        return new OAuthAuthorizerMiddleware<TClaims>(this._container);
    }
}
