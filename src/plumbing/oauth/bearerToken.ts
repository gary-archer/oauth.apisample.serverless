import {ErrorFactory} from '../errors/errorFactory.js';
import {APIGatewayProxyExtendedEvent} from '../utilities/apiGatewayExtendedProxyEvent.js';

/*
 * A simple class to read the access token from the request
 */
export class BearerToken {

    /*
     * Try to read the token from the authorization header
     */
    public static read(event: APIGatewayProxyExtendedEvent): string {

        if (event && event.headers) {

            const authorizationHeader = event.headers.authorization || event.headers.Authorization;
            if (authorizationHeader) {
                const parts = authorizationHeader.split(' ');
                if (parts.length === 2 && parts[0] === 'Bearer') {
                    return parts[1];
                }
            }
        }

        throw ErrorFactory.createClient401Error('No access token was found in an API request');
    }
}
