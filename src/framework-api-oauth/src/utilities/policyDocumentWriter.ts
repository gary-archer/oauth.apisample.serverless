import {CoreApiClaims} from '../../../framework-api-base';

/*
 * Helper methods to return responses
 */
export class PolicyDocumentWriter {

    /*
     * The authorized response includes an aws policy document
     * We also add our custom claims to the context
     */
    public static authorizedResponse(claims: CoreApiClaims, event: any): object {

        const context = {
            claims: JSON.stringify(claims),
        };

        return PolicyDocumentWriter._policyDocument(claims.userId, 'Allow', event, context);
    }

    /*
     * Return a 401 invalid token policy response to the caller which is an AWS ACCESS_DENIED gateway response
     * Note that 500 technical errors are not handled via a policy document and do not support runtime customization
     * https://forums.aws.amazon.com/thread.jspa?threadID=226689
     */
    public static invalidTokenResponse(event: any): any {

        return PolicyDocumentWriter._policyDocument('*', 'Deny', event, {});
    }

    /*
     * Write an authorized or unauthorized policy document
     */
    private static _policyDocument(userId: string, effect: string, event: any, context: any): any {

        const serviceArn = PolicyDocumentWriter._getServiceArn(event.methodArn);
        return {
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
    }

    /*
     * This takes an ARN for the current API request, such as this:
     *   arn:aws:execute-api:eu-west-2:090109105180:cqo3riplm6/default/GET/companies
     *
     * It reduces it to a wildcard that applies to all lambdas in the service:
     *   arn:aws:execute-api:eu-west-2:090109105180:cqo3riplm6/default/*
     *
     * The policy document will be cached and will then be usable for any secured API request
     */
    private static _getServiceArn(methodArn: string): any {

        // Get the last part, such as cqo3riplm6/default/GET/companies
        const parts = methodArn.split(':');
        if (parts.length === 6) {

            // Split the path into parts
            const pathParts = parts[5].split('/');
            if (pathParts.length >= 4) {

                // Update the final part to a wildcard value such as cqo3riplm6/default/* and then rejoin
                parts[5] = `${pathParts[0]}/${pathParts[1]}/*`;
                const result = parts.join(':');
                return result;
            }
        }

        // Sanity check
        throw new Error(`Unexpected method ARN received: ${methodArn}`);
    }
}
