import {APIGatewayProxyEvent} from 'aws-lambda';
import {inject, injectable} from 'inversify';
import {CookieProcessor} from '../cookies/cookieProcessor';
import {BASETYPES} from '../dependencies/baseTypes';
import {ErrorFactory} from '../errors/errorFactory';

/*
 * A class to deal with retrieving the access token, which is either received directly or in a secure cookie
 */
@injectable()
export class AccessTokenRetriever {

    private readonly _cookieProcessor: CookieProcessor;

    public constructor(
        @inject(BASETYPES.CookieProcessor) cookieProcessor: CookieProcessor) {
        this._cookieProcessor = cookieProcessor;
    }

    /*
     * Try to read the token from either the authorization header or cookies
     */
    public getAccessToken(event: APIGatewayProxyEvent): string {

        // First look for a bearer token
        if (event && event.headers) {

            const authorizationHeader = event.headers.authorization || event.headers.Authorization;
            if (authorizationHeader) {
                const parts = authorizationHeader.split(' ');
                if (parts.length === 2 && parts[0] === 'Bearer') {
                    return parts[1];
                }
            }
        }

        // Next look for a secure cookie
        const accessToken = this._cookieProcessor.getAccessToken(event);
        if (!accessToken) {
            throw ErrorFactory.createClient401Error('No access token was found in an API request');
        }

        return accessToken;
    }
}
