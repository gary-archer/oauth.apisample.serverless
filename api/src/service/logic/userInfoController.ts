import {Context} from 'aws-lambda';
import {ApiLogger} from '../../shared/plumbing/apiLogger';

/*
 * A simple API controller to return user info
 */
export class UserInfoController {

    /*
     * Return user info to the UI
     */
    public static async getUserClaims(event: any, context: Context): Promise<any> {

        ApiLogger.info('UserInfoController', 'Returning user info');
        const userInfo = event.claims.userInfo;

        return {
            statusCode: 200,
            body: JSON.stringify(userInfo),
        };
    }
}
