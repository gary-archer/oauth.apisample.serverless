import {ApiClaims} from '../entities/apiClaims';
import {ClientError} from '../entities/clientError';
import {RequestLogger} from './requestLogger';

/*
 * Helper methods to return responses
 */
export class ResponseHandler {

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
     * The authorized response includes an aws policy document
     * We also add our custom claims to the context
     */
    public static authorizedResponse(claims: ApiClaims, event: any): object {

        const context = {
            claims: JSON.stringify(claims),
        };

        return ResponseHandler._policyDocument(claims.userId, 'Allow', event, context);
    }

    /*
     * Return an invalid token policy response to the caller which is an AWS ACCESS_DENIED gateway response
     */
    public static invalidTokenResponse(event: any): any {

        return ResponseHandler._policyDocument('*', 'Deny', event, {});
    }

    /*
     * I would like to return a 500 error and this error object to the caller
     * Unfortunately this is not supported via any of these methods:
     * - Returning a policy document
     * - Setting a context error object or calling context.fail
     *
     * Responses without a policy document returns an AUTHORIZER_CONFIGURATION_ERROR that are not runtime customizable
     * https://forums.aws.amazon.com/thread.jspa?threadID=226689
     */
    public static authorizationErrorResponse(statusCode: number, error: ClientError): object {

        return ResponseHandler.objectResponse(statusCode, error);
    }

    /*
     * Write an authorized or unauthorized policy document
     */
    private static _policyDocument(userId: string, effect: string, event: any, context: any) {

        const serviceArn = ResponseHandler._getServiceArn(event.methodArn, event.log);
        const result = {
            principalId: userId,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: effect,
                        Resource: serviceArn,
                    },
                ],
            },
            context,
        };

        return result;
    }

    /*
     * This takes an ARN for the current API request, such as this:
     *   arn:aws:execute-api:eu-west-2:090109105180:cqo3riplm6/default/GET/companies
     *
     * It reduces it to a wildcard that applies to all lambdas in the service:
     *   arn:aws:execute-api:eu-west-2:090109105180:cqo3riplm6/default/GET/companies
     *
     * The policy document will be cached and will then be usable for any secured API request
     */
    private static _getServiceArn(methodArn: string, log: RequestLogger) {

        // Get the last part, such as cqo3riplm6/default/GET/companies
        log.debug('PolicyDocument', `Method ARN is ${methodArn}`);
        const parts = methodArn.split(':');
        if (parts.length === 6) {

            // Split the path into parts
            const pathParts = parts[5].split('/');
            if (pathParts.length >= 4) {

                // Update the final part to a wildcard value such as cqo3riplm6/default/* and then rejoin
                parts[5] = `${pathParts[0]}/${pathParts[1]}/*`;
                const result = parts.join(':');
                log.debug('PolicyDocument', `Service resource path is ${result}`);
                return result;
            }
        }

        // Sanity check
        throw new Error(`Unexpected method ARN received: ${methodArn}`);
    }
}
