import {APIGatewayProxyResult} from 'aws-lambda';
import {ClientError} from '../errors/clientError';

/*
 * A utility to write REST responses from objects and deal with common aspects
 */
export class ResponseWriter {

    /*
     * Return a success response to the caller
     */
    public static successResponse(statusCode: number, body: any): APIGatewayProxyResult {

        return {
            statusCode,
            body: JSON.stringify(body)
        };
    }

    /*
     * Return a client friendly error response
     */
    public static errorResponse(statusCode: number, error: ClientError): APIGatewayProxyResult {

        const response = {
            statusCode,
            body: JSON.stringify(error.toResponseFormat()),
        } as APIGatewayProxyResult;

        // For 401 errors, we could return the standards based OAuth response header
        // But the AWS API gateway renames it, so currently I do not return the header
        if (error.getStatusCode() === 401) {

            /*
            const realm = 'mycompany.com';
            let wwwAuthenticateHeader = `Bearer realm="${realm}"`;
            wwwAuthenticateHeader += `, error="${error.getErrorCode()}"`;
            wwwAuthenticateHeader += `, error_description="${error.message}"`;
            response.headers = {
                'www-authenticate': wwwAuthenticateHeader,
            };
            */
        }

        return response;
    }
}
