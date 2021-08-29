import {BaseErrorCodes} from './baseErrorCodes';
import {ClientError} from './clientError';
import {ErrorFactory} from './errorFactory';
import {ServerError} from './ServerError';

/*
 * General error utility functions
 */
export class ErrorUtils {

    /*
     * Return or create a typed error
     */
    public static fromException(exception: any): ServerError | ClientError {

        const serverError = this.tryConvertToServerError(exception);
        if (serverError !== null) {
            return serverError;
        }

        const clientError = this.tryConvertToClientError(exception);
        if (clientError !== null) {
            return clientError;
        }

        return ErrorUtils.createServerError(exception);
    }

    /*
     * Create an error from an exception
     */
    public static createServerError(exception: any, errorCode?: string, message?: string): ServerError {

        // Default details
        const defaultErrorCode = BaseErrorCodes.serverError;
        const defaultMessage = 'An unexpected exception occurred in the API';

        // Create the error
        const error = ErrorFactory.createServerError(
            errorCode || defaultErrorCode,
            message || defaultMessage,
            exception.stack);
        error.setDetails(ErrorUtils._getExceptionDetailsMessage(exception));
        return error;
    }

    /*
     * Try to convert an exception to a server error
     */
    private static tryConvertToServerError(exception: any): ServerError | null {

        if (exception instanceof ServerError) {
            return exception;
        }

        return null;
    }

    /*
     * Try to convert an exception to the ClientError interface
     * At runtime the type no interface details are available so we have to check for known members
     */
    private static tryConvertToClientError(exception: any): ClientError | null {

        if (exception.getStatusCode && exception.toResponseFormat && exception.toLogFormat) {
            return exception as ClientError;
        }

        return null;
    }

    /*
     * Get the message from an exception and avoid returning [object Object]
     */
    private static _getExceptionDetailsMessage(e: any): string {

        if (e.message) {
            return e.message;
        }

        const details = e.toString();
        if (details !== {}.toString()) {
            return details;
        }

        return '';
    }
}
