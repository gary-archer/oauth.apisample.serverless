import {APIGatewayEvent, Context} from 'aws-lambda';
import {IHandlerLambda} from 'middy';
import {Configuration} from '../configuration/configuration';
import {ApiClaims} from '../entities/apiClaims';
import {ApiLogger} from './apiLogger';

/*
 * Custom middleware for authorization
 */
export const authorizationMiddleware = (config: Configuration) => {

    return ({
      before: (handler: IHandlerLambda<any, any>, next: any) => {

        // For now we'll return a hard coded result
        const claims = new ApiClaims('gary.archer', '', '');
        claims.setProductSpecificUserRights([1, 2, 3]);
        handler.event.claims = claims;

        // TODO: Try to convert this to a class and export a single public function

        return next();
      },
    });
};
