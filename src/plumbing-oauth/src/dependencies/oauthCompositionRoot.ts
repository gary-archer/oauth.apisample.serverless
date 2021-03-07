import middy from '@middy/core';
import {CustomAuthorizerResult} from 'aws-lambda';
import {Container} from 'inversify';
import {CustomClaimsProvider} from '../claims/customClaimsProvider';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {OAUTHTYPES} from '../dependencies/oauthTypes';
import {OAuthAuthenticator} from '../oauth/oauthAuthenticator';
import {OAuthAuthorizer} from '../oauth/oauthAuthorizer';

/*
 * Create dependencies needed to do OAuth processing
 */
export class OAuthCompositionRoot {

    // Constructor properties
    private readonly _container: Container;

    // Builder properties
    private _configuration: OAuthConfiguration | null;
    private _customClaimsProvider: CustomClaimsProvider | null;

    /*
     * Set initial values
     */
    public constructor(container: Container) {
        this._container = container;
        this._configuration = null;
        this._customClaimsProvider = null;
    }

    /*
     * Indicate that we're using OAuth and receive the configuration
     */
    public useOAuth(configuration: OAuthConfiguration): OAuthCompositionRoot {
        this._configuration = configuration;
        return this;
    }

    /*
     * Consumers of the builder class can provide a constructor function for injecting custom claims
     */
    public withCustomClaimsProvider(provider: CustomClaimsProvider) : OAuthCompositionRoot {

        this._customClaimsProvider = provider;
        return this;
    }

    /*
     * Register OAuth related dependencies needed for inversify to autowire types
     */
    public register(): OAuthCompositionRoot {

        this._registerOAuthDependencies();
        return this;
    }

    /*
     * Get an authorizer middleware that does OAuth lookups to get claims
     */
    public getAuthorizerMiddleware(): middy.MiddlewareObject<any, any> {
        return new OAuthAuthorizer(this._container, this._customClaimsProvider!);
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
}
