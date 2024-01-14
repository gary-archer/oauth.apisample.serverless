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
     * This blog's examples use a JSON response to provide client friendly OAuth errors
     * When required, such as to inform clients how to integrate, a www-authenticate header can be added here
     * - https://datatracker.ietf.org/doc/html/rfc6750#section-3
     */
    public static errorResponse(statusCode: number, error: ClientError): APIGatewayProxyResult {

        return {
            statusCode,
            body: JSON.stringify(error.toResponseFormat()),
        } as APIGatewayProxyResult;
    }
}
