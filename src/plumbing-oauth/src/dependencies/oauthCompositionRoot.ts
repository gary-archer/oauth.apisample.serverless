import middy from '@middy/core';
import {CustomAuthorizerResult} from 'aws-lambda';
import {Container} from 'inversify';
import jwksRsa, {JwksClient} from 'jwks-rsa';
import {HttpProxy} from '../../../plumbing-base';
import {CustomClaimsProvider} from '../claims/customClaimsProvider';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {OAUTHTYPES} from '../dependencies/oauthTypes';
import {JwtValidator} from '../oauth/jwtValidator';
import {OAuthAuthenticator} from '../oauth/oauthAuthenticator';
import {OAuthAuthorizer} from '../oauth/oauthAuthorizer';

/*
 * Create dependencies needed to do OAuth processing
 */
export class OAuthCompositionRoot {

    private readonly _container: Container;
    private _configuration: OAuthConfiguration | null;
    private _customClaimsProvider: CustomClaimsProvider | null;
    private _httpProxy: HttpProxy | null;

    public constructor(container: Container) {
        this._container = container;
        this._configuration = null;
        this._customClaimsProvider = null;
        this._httpProxy = null;
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
     * Receive the HTTP proxy object, which is only used on a developer PC
     */
    public useHttpProxy(httpProxy: HttpProxy): OAuthCompositionRoot {
        this._httpProxy = httpProxy;
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

        // Create the singleton JWKS client, which caches JWKS keys between requests
        const proxyUrl = this._httpProxy!.getUrl();
        const jwksClient = jwksRsa({
            jwksUri: this._configuration!.jwksEndpoint,
            proxy: proxyUrl ? proxyUrl : undefined,
        });

        // Register singletons
        this._container.bind<OAuthConfiguration>(OAUTHTYPES.Configuration)
            .toConstantValue(this._configuration!);
        this._container.bind<JwksClient>(OAUTHTYPES.JwksClient)
            .toConstantValue(jwksClient);

        // Register per request objects
        this._container.bind<OAuthAuthenticator>(OAUTHTYPES.OAuthAuthenticator)
            .to(OAuthAuthenticator).inTransientScope();
        this._container.bind<JwtValidator>(OAUTHTYPES.JwtValidator)
            .to(JwtValidator).inTransientScope();

        // Register a dummy value that is overridden by the authorizer middleware later
        this._container.bind<CustomAuthorizerResult>(OAUTHTYPES.AuthorizerResult)
            .toConstantValue({} as any);

        return this;
    }
}
