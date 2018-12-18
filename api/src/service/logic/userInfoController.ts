import {Context} from 'aws-lambda';
import {ResponseHandler} from '../../shared/plumbing/responseHandler';

/*
 * A simple API controller to return user info
 */
export class UserInfoController {

    /*
     * Return user info to the UI
     */
    public async getUserClaims(event: any, context: Context): Promise<any> {

        // Add to the request log
        event.log.debug('UserInfoController', 'Getting user claims');

        const userInfo = event.claims.userInfo;
        return ResponseHandler.objectResponse(200, userInfo);
    }
}
