import {APIGatewayProxyResult} from 'aws-lambda';
import {ClientError} from '../errors/clientError.js';

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
     * This blog's clients read a JSON response, to handle OAuth errors in the same way as other errors
     * Also add the standard www-authenticate header for interoperability
     */
    public static errorResponse(statusCode: number, error: ClientError, scope: string): APIGatewayProxyResult {

        let wwwAuthenticate: string | null = null;

        if (error.getStatusCode() === 401) {
            wwwAuthenticate =
                `Bearer error="${error.getErrorCode()}", error_description="${error.message}"`;
        }

        if (error.getStatusCode() === 403) {
            wwwAuthenticate =
                `Bearer error="${error.getErrorCode()}", error_description="${error.message}", scope="${scope}"`;
        }

        const response = {
            statusCode,
            body: JSON.stringify(error.toResponseFormat()),
        } as APIGatewayProxyResult;

        if (wwwAuthenticate) {
            response.headers = {
                'www-authenticate': wwwAuthenticate,
            }
        }

        return response;
    }

    /*
     * Handle startup errors with reduced logic
     */
    public static startupErrorResponse(statusCode: number, error: ClientError) {

        return {
            statusCode,
            body: JSON.stringify(error.toResponseFormat()),
        } as APIGatewayProxyResult;
    }
}
