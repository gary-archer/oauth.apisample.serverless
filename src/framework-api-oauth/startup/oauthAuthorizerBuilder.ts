import {Container} from 'inversify';
import {MiddlewareObject} from 'middy';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {OAUTHINTERNALTYPES} from '../configuration/oauthInternalTypes';
import {OAuthAuthenticator} from '../security/oauthAuthenticator';
import {OAuthAuthorizer} from '../security/oauthAuthorizer';
import {OAuthAuthorizerMiddleware} from '../security/oauthAuthorizerMiddleware';

/*
 * A factory class that runs at lambda startup to set up
 */
export class OAuthAuthorizerBuilder {

    private readonly _container: Container;
    private readonly _configuration: OAuthConfiguration;

    public constructor(container: Container, configuration: OAuthConfiguration) {
        this._container = container;
        this._configuration = configuration;
    }

    /*
     * Register OAuth related dependencies needed for inversify to autowire types
     */
    public register(): void {
        this._container.bind<OAuthConfiguration>(OAUTHINTERNALTYPES.Configuration).toConstantValue(this._configuration);
        this._container.bind<OAuthAuthenticator>(OAUTHINTERNALTYPES.OAuthAuthenticator).to(OAuthAuthenticator);
        this._container.bind<OAuthAuthorizer>(OAUTHINTERNALTYPES.OAuthAuthorizer).to(OAuthAuthorizer);
    }

    /*
     * Create the middleware which triggers the OAuth work
     */
    public createMiddleware(): MiddlewareObject<any, any> {
        return new OAuthAuthorizerMiddleware(this._container);
    }
}
