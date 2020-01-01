import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';
import {APIFRAMEWORKTYPES} from '../configuration/apiFrameworkTypes';
import {INTERNALTYPES} from '../configuration/internalTypes';
import {ContainerHelper} from '../utilities/containerHelper';
import {BaseAuthorizerMiddleware} from './baseAuthorizerMiddleware';
import {CoreApiClaims} from './coreApiClaims';
import {RequestContextAuthenticator} from './requestContextAuthenticator';

/*
 * A simple middleware to extract claims from the request context written by the lambda authorizer
 */
export class RequestContextAuthorizer
       extends BaseAuthorizerMiddleware implements MiddlewareObject<any, any> {

    public constructor() {
        super();
        this._setupCallbacks();
    }

    /*
     * Return claims that were provided by our lambda authorizer
     */
    public before(handler: HandlerLambda<any, any>, next: NextFunction): void {

        // Resolve the class that does the work
        const container = ContainerHelper.current(handler.event);
        const authenticator =
            container.get<RequestContextAuthenticator>(INTERNALTYPES.RequestContextAuthenticator);

        // Read claims from the request context
        const claims = authenticator.authorizeRequestAndGetClaims(handler.event, handler.context);

        // Make them available for injection into business logic
        container.bind<CoreApiClaims>(APIFRAMEWORKTYPES.CoreApiClaims).toConstantValue(claims);

        // Include identity details in logs
        super.logIdentity(container, claims);

        next();
    }

    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
