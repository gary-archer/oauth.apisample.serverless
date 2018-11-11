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
     * Return an invalid token response to the caller
     */
    public static invalidTokenResponse(event: any): any {

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
    private static _policyDocument(userId: string, effect: string, methodArn: string, context: any) {

        const serviceArn = ResponseHandler._getServiceArn(methodArn);
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
     * TODO: Set the ARN properly
     */
    private static _getServiceArn(methodArn: string) {

        console.log(`Method ARN is ${methodArn}`);

        // const methodArnExample = 'arn:aws:execute-api:eu-west-2:090109105180:cqo3riplm6/dev/GET/companies';

        // Parse the input for the parameter values
        var tmp = methodArn.split(':');
        var apiGatewayArnTmp = tmp[5].split('/');

        console.log(`API Gateway ARN is ${apiGatewayArnTmp}`);

        var awsAccountId = tmp[4];
        var region = tmp[3];
        var restApiId = apiGatewayArnTmp[0];

        console.log(`Rest API id is ${apiGatewayArnTmp}`);

        var stage = apiGatewayArnTmp[1];
        var method = apiGatewayArnTmp[2];

        console.log(`Method is ${method}`);

        var resource = '/'; // root resource
        
        /*if (apiGatewayArnTmp[3]) {
            resource += apiGatewayArnTmp[3];
        }*/

        console.log(`Service ARN is ${resource}`);

        return 'arn:aws:execute-api:eu-west-2:090109105180:cqo3riplm6/dev/*';
        return resource;
    }
}
