import {Request, Response} from 'express';
import {ClientError} from '../entities/clientError';

/*
 * A generic 401 message
 */
const INVALID_TOKEN_MESSAGE = 'Missing, invalid or expired access token';

/*
 * Helper methods to write the response
 */
export class ResponseWriter {

    /*
     * Return data to the caller, which could be a success or error object
     */
    public static writeObject(response: Response, statusCode: number, data: any) {
        ResponseWriter._writeContentHeader(response);
        response.status(statusCode).send(JSON.stringify(data));
    }

    /*
     * Return a missing token response to the caller
     */
    public static writeMissingTokenResponse(response: Response): void {
        ResponseWriter._writeContentHeader(response);
        response.setHeader('WWW-Authenticate', 'Bearer');
        response.status(401).send(JSON.stringify(INVALID_TOKEN_MESSAGE));
    }

    /*
     * Return an invalid token response to the caller
     */
    public static writeInvalidTokenResponse(response: Response): void {
        ResponseWriter._writeContentHeader(response);
        response.setHeader('WWW-Authenticate', 'Bearer, error=invalid_token');
        response.status(401).send(JSON.stringify(INVALID_TOKEN_MESSAGE));
    }

    /*
     * All responses are JSON
     */
    private static _writeContentHeader(response: Response) {
        response.setHeader('Content-Type', 'application/json');
    }
}
