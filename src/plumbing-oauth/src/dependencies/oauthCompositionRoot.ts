import middy from '@middy/core';
import {CustomAuthorizerResult} from 'aws-lambda';
import {Container} from 'inversify';
import {CoreApiClaims} from '../../../plumbing-base';
import {ClaimsSupplier} from '../claims/claimsSupplier';
import {CustomClaimsProvider} from '../claims/customClaimsProvider';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {OAUTHTYPES} from '../dependencies/oauthTypes';
import {OAuthAuthenticator} from '../oauth/oauthAuthenticator';
import {OAuthAuthorizer} from '../oauth/oauthAuthorizer';

/*
 * Create dependencies needed to do OAuth processing
 */
export class OAuthCompositionRoot<TClaims extends CoreApiClaims> {

    // Constructor properties
    private readonly _container: Container;

    // Builder properties
    private _configuration: OAuthConfiguration | null;
    private _claimsSupplier!: () => TClaims;
    private _customClaimsProviderSupplier!: () => CustomClaimsProvider<TClaims>;

    /*
     * Set initial values
     */
    public constructor(container: Container) {
        this._container = container;
        this._configuration = null;
    }

    /*
     * Indicate that we're using OAuth and receive the configuration
     */
    public useOAuth(configuration: OAuthConfiguration): OAuthCompositionRoot<TClaims> {
        this._configuration = configuration;
        return this;
    }

    /*
     * Consumers of the builder class must provide a constructor function for creating claims
     */
    public withClaimsSupplier(construct: new () => TClaims): OAuthCompositionRoot<TClaims> {
        this._claimsSupplier = () => new construct();
        return this;
    }

    /*
     * Consumers of the builder class can provide a constructor function for injecting custom claims
     */
    public withCustomClaimsProviderSupplier(construct: new () => CustomClaimsProvider<TClaims>)
            : OAuthCompositionRoot<TClaims> {

        this._customClaimsProviderSupplier = () => new construct();
        return this;
    }

    /*
     * Register OAuth related dependencies needed for inversify to autowire types
     */
    public register(): OAuthCompositionRoot<TClaims> {

        this._registerOAuthDependencies();
        this._registerClaimsDependencies();
        return this;
    }

    /*
     * Get an authorizer middleware that does OAuth lookups to get claims
     */
    public getAuthorizerMiddleware(): middy.MiddlewareObject<any, any> {
        return new OAuthAuthorizer<TClaims>(this._container);
    }

    /*
     * Register OAuth specific dependencies
     */
    private _registerOAuthDependencies() {

        // Register singletons
        this._container.bind<OAuthConfiguration>(OAUTHTYPES.Configuration)
            .toConstantValue(this._configuration!);

        // Register the authenticator to be created on every request, where it is only auto wired once
        this._container.bind<OAuthAuthenticator>(OAUTHTYPES.OAuthAuthenticator)
            .to(OAuthAuthenticator).inTransientScope();

        // Register a dummy value that is overridden by the authorizer middleware later
        this._container.bind<CustomAuthorizerResult>(OAUTHTYPES.AuthorizerResult)
            .toConstantValue({} as any);

        return this;

    }

    /*
     * Register claims specific dependencies
     */
    private _registerClaimsDependencies() {

        // Create an injectable object to enable the framework to create claims objects of a concrete type at runtime
        const claimsSupplier = ClaimsSupplier.createInstance<ClaimsSupplier<TClaims>, TClaims>(
            ClaimsSupplier,
            this._claimsSupplier,
            this._customClaimsProviderSupplier);

        // Register singletons
        this._container.bind<ClaimsSupplier<TClaims>>(OAUTHTYPES.ClaimsSupplier)
            .toConstantValue(claimsSupplier);

        return this;
    }
}
