import {ApiError} from './apiError';
import {ApiErrorImpl} from './apiErrorImpl';
import {BaseErrorCodes} from './baseErrorCodes';
import {ClientError} from './clientError';
import {ClientErrorImpl} from './clientErrorImpl';

/*
 * An error factory class that returns the interface rather than the concrete type
 */
export class ErrorFactory {

    /*
     * Create a server error
     */
    public static createApiError(errorCode: string, userMessage: string, stack?: string | undefined): ApiError {
        return new ApiErrorImpl(errorCode, userMessage, stack);
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
        error.logContext = logContext;
        return error;
    }

    /*
     * Create a 401 error with the reason
     */
    public static create401Error(reason: string): ClientError {

        const error = new ClientErrorImpl(
            401,
            BaseErrorCodes.unauthorizedRequest,
            'Missing, invalid or expired access token');
        error.logContext = reason;
        return error;
    }
}
