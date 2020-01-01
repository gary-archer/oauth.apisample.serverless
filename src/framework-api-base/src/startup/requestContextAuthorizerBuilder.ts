import {Container} from 'inversify';
import {MiddlewareObject} from 'middy';
import {INTERNALTYPES} from '../configuration/internalTypes';
import {RequestContextAuthenticator} from '../security/requestContextAuthenticator';
import {RequestContextAuthorizer} from '../security/requestContextAuthorizer';

/*
 * A factory class that runs at lambda startup to set up
 */
export class RequestContextAuthorizerBuilder {

    private readonly _container: Container;

    public constructor(container: Container) {
        this._container = container;
    }

    /*
     * Register dependencies needed for inversify to autowire types
     */
    public register(): RequestContextAuthorizerBuilder {
        this._container.bind<RequestContextAuthenticator>(INTERNALTYPES.RequestContextAuthenticator)
                       .to(RequestContextAuthenticator).inTransientScope();
        return this;
    }

    /*
     * Create the middleware which triggers the OAuth work
     */
    public createAuthorizer(): MiddlewareObject<any, any> {
        return new RequestContextAuthorizer();
    }
}
