import {ApiClaims} from '../entities/apiClaims';

/*
 * A generic 401 message
 */
const INVALID_TOKEN_MESSAGE = 'Missing, invalid or expired access token';

/*
 * Helper methods to return responses
 */
export class ResponseHandler {

    /*
     * The authorized response includes an aws policy document
     * We also add our custom claims to the context
     */
    public static authorizedResponse(claims: ApiClaims, event: any): object {

        const context = {
            claims: JSON.stringify(claims),
        };

        return ResponseHandler._policyDocument(claims.userId, 'Allow', event.methodArn, context);
    }

    /*
     * Return a missing token response to the caller
     */
    public static missingTokenResponse(event: any): any {

        const context = {
            unauthorizedResponse: {
                statusCode: 401,
                headers: {
                    'WWW-Authenticate': 'Bearer',
                },
                body: JSON.stringify(INVALID_TOKEN_MESSAGE),
            },
        };

        return ResponseHandler._policyDocument('unauthorized', 'Deny', event.methodArn, context);
    }

    /*
     * Return an invalid token response to the caller
     */
    public static invalidTokenResponse(event: any): any {

        const context = {
            unauthorizedResponse: {
                statusCode: 401,
                headers: {
                    'WWW-Authenticate': 'Bearer, error=invalid_token',
                },
                body: JSON.stringify(INVALID_TOKEN_MESSAGE),
            },
        };

        return ResponseHandler._policyDocument('unauthorized', 'Deny', event.methodArn, context);
    }

    /*
     * Return data to the caller, which could be a success or error object
     */
    public static objectResponse(statusCode: number, data: any): any {

        return {
            statusCode,
            body: JSON.stringify(data),
        };
    }

    /*
     * Write an authorized or unauthorized policy document
     */
    private static _policyDocument(userId: string, effect: string, resource: string, context: any) {

        const doc = {
            principalId: userId,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: effect,
                        Resource: resource,
                    },
                ],
            },
            context,
        };

        // TODO - remove once stable and once I understand error responses
        console.log('*** DEBUG AUTHORIZER RESPONSE');
        console.log(doc);
        return doc;
    }
}
