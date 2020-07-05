import middy from '@middy/core';
import {Context} from 'aws-lambda';
import {Container} from 'inversify';
import {CoreApiClaims} from '../claims/coreApiClaims';
import {BASETYPES} from '../dependencies/baseTypes';
import {ErrorUtils} from '../errors/errorUtils';
import {BaseAuthorizerMiddleware} from './baseAuthorizerMiddleware';

/*
 * Used by normal lambdas to read claims from the request context and set up data needed for authorization
 * These claims are written earlier by the lambda authorizer when it does OAuth processing for a new token
 */
export class RequestContextAuthorizer
       extends BaseAuthorizerMiddleware implements middy.MiddlewareObject<any, any> {

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
        const claims = this._readClaims(handler.event, handler.context);

        // Make them available for injection into business logic
        this._container.rebind<CoreApiClaims>(BASETYPES.CoreApiClaims).toConstantValue(claims);

        // Include identity details in logs
        super.logIdentity(this._container, claims);
        next();
    }

    /*
     * Read claims passed into the request context as a result of returning the policy document from an authorizer
     */
    private _readClaims(event: any, context: Context): CoreApiClaims {

        if (!event.requestContext ||
            !event.requestContext.authorizer ||
            !event.requestContext.authorizer.customClaims) {

            throw new Error('Unable to resolve authorizer claims from request context');
        }

        let claims: CoreApiClaims;
        if (typeof event.requestContext.authorizer.customClaims === 'string') {

            // In AWS we receive a serialized object
            claims = JSON.parse(event.requestContext.authorizer.customClaims);
        } else {

            // On a local PC we have an object
            claims = event.requestContext.authorizer.customClaims;
        }

        // Make some sanity checks before returning the result
        this._checkClaim(claims, (c) => c.subject, 'subject');
        this._checkClaim(claims, (c) => c.clientId, 'clientId');
        this._checkArrayClaim(claims, (c) => c.scopes, 'scope');
        this._checkClaim(claims, (c) => c.expiry.toString(), 'expiry');
        this._checkClaim(claims, (c) => c.givenName, 'givenName');
        this._checkClaim(claims, (c) => c.familyName, 'familyName');
        this._checkClaim(claims, (c) => c.email, 'email');
        this._checkClaim(claims, (c) => c.userDatabaseId, 'userDatabaseId');
        return claims;
    }

    /*
     * Try to read a claim from the supplied object
     */
    private _checkClaim(claims: CoreApiClaims, accessor: (c: CoreApiClaims) => string, claimName: string): void {

        const result = accessor(claims);
        if (!result) {
            throw ErrorUtils.fromMissingClaim(claimName);
        }
    }

    /*
     * Try to read an array claim from the supplied object
     */
    private _checkArrayClaim(claims: CoreApiClaims, accessor: (c: CoreApiClaims) => string[], claimName: string): void {

        const result = accessor(claims);
        if (!result) {
            throw ErrorUtils.fromMissingClaim(claimName);
        }
    }

    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
