import {BaseErrorCodes} from './baseErrorCodes.js';
import {ClientError} from './clientError.js';
import {ClientErrorImpl} from './clientErrorImpl.js';
import {ServerError} from './serverError.js';
import {ServerErrorImpl} from './serverErrorImpl.js';

/*
 * An error factory class that returns the interface rather than the concrete type
 */
export class ErrorFactory {

    /*
     * Create a server error
     */
    public static createServerError(errorCode: string, userMessage: string, stack?: string | undefined): ServerError {
        return new ServerErrorImpl(errorCode, userMessage, stack);
    }

    /*
     * Create an error indicating a client problem
     */
    public static createClientError(statusCode: number, errorCode: string, userMessage: string): ClientError {
        return new ClientErrorImpl(statusCode, errorCode, userMessage);
    }

    /*
     * Create an error indicating a client problem with additional context
     */
    public static createClientErrorWithContext(
        statusCode: number,
        errorCode: string,
        userMessage: string,
        logContext: string): ClientError {

        const error = new ClientErrorImpl(statusCode, errorCode, userMessage);
        error.setLogContext(logContext);
        return error;
    }

    /*
     * Create a 401 error with the reason
     */
    public static createClient401Error(details: string): ClientError {

        const error = new ClientErrorImpl(
            401,
            BaseErrorCodes.invalidToken,
            'Missing, invalid or expired access token');
        error.setLogContext({
            details,
        });
        return error;
    }
}
