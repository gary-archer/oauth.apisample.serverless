import {APIGatewayEvent, Context} from 'aws-lambda';
import {IHandlerLambda} from 'middy';
import {Configuration} from '../configuration/configuration';
import {ApiClaims} from '../entities/apiClaims';
import {ApiLogger} from './apiLogger';

/*
 * The middleware coded in a class based manner
 */
class AuthorizationMiddleware {

    private _apiConfig: Configuration;

    public constructor(apiConfig: Configuration) {
        this._apiConfig = apiConfig;
        this.onBefore = this.onBefore.bind(this);
    }

    public onBefore(handler: IHandlerLambda<any, any>, next: any) {
        handler.event.claims = this._getHardCodedClaims();
        return next();
    }

    // TODO: replace once authorization is done properly
    private _getHardCodedClaims(): ApiClaims {
        const claims = new ApiClaims('gary.archer', '', '');
        claims.setProductSpecificUserRights([1, 2, 3]);
        return claims;
    }
}

/*
 * Do the export plumbing
 */
export const authorizationMiddleware = (config: Configuration) => {
    const middleware = new AuthorizationMiddleware(config);
    return ({
        before: middleware.onBefore,
    });
};
