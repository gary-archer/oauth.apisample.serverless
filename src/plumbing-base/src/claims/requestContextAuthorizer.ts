import middy from '@middy/core';
import {Container} from 'inversify';
import {ApiClaims} from '../claims/apiClaims';
import {CustomClaims} from '../claims/customClaims';
import {TokenClaims} from '../claims/tokenClaims';
import {UserInfoClaims} from '../claims/userInfoClaims';
import {BASETYPES} from '../dependencies/baseTypes';
import {BaseAuthorizerMiddleware} from './baseAuthorizerMiddleware';

/*
 * Used by normal lambdas to read claims from the request context and set up data needed for authorization
 * These claims are written earlier by the lambda authorizer when it does OAuth processing for a new token
 */
export class RequestContextAuthorizer extends BaseAuthorizerMiddleware implements middy.MiddlewareObject<any, any> {

    private readonly _container: Container;

    public constructor(container: Container) {
        super();
        this._container = container;
        this._setupCallbacks();
    }

    /*
     * Return claims that were provided by our lambda authorizer
     */
    public before(handler: middy.HandlerLambda<any, any>, next: middy.NextFunction): void {

        // Read claims from the request context
        const claims = this._readClaims(handler.event);

        // Make claims objects available for injection into business logic
        this._container.rebind<TokenClaims>(BASETYPES.TokenClaims).toConstantValue(claims.token);
        this._container.rebind<UserInfoClaims>(BASETYPES.UserInfoClaims).toConstantValue(claims.userInfo);
        this._container.rebind<CustomClaims>(BASETYPES.CustomClaims).toConstantValue(claims.custom);

        // Include identity details in logs
        super.logIdentity(this._container, claims.token);
        next();
    }

    /*
     * Read claims passed into the request context as a result of returning the policy document from an authorizer
     */
    private _readClaims(event: any): ApiClaims {

        if (!event.requestContext ||
            !event.requestContext.authorizer ||
            !event.requestContext.authorizer.customClaims) {

            throw new Error('Unable to resolve authorizer claims from request context');
        }

        // TODO: deserialize

        // In AWS we receive a serialized object whereas on a local PC we have an object already
        return (typeof event.requestContext.authorizer.customClaims === 'string') ?
            JSON.parse(event.requestContext.authorizer.customClaims) :
            event.requestContext.authorizer.customClaims;
    }

    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
