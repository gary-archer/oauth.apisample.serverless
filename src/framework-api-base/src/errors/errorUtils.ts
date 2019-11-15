import {ApiError} from './apiError';
import {ClientError} from './clientError';

/*
 * General error utility functions
 */
export class ErrorUtils {

    /*
     * Return or create a typed error
     */
    public static fromException(exception: any): ApiError | ClientError {

        const apiError = this.tryConvertToApiError(exception);
        if (apiError !== null) {
            return apiError;
        }

        const clientError = this.tryConvertToClientError(exception);
        if (clientError !== null) {
            return clientError;
        }

        return ErrorUtils.createApiError(exception);
    }

    /*
     * Create an error from an exception
     */
    public static createApiError(exception: any, errorCode?: string, message?: string): ApiError {

        // Default details
        const defaultErrorCode = 'server_error';
        const defaultMessage = 'An unexpected exception occurred in the API';

        // Create the error
        const error = new ApiError(errorCode || defaultErrorCode, message || defaultMessage);
        error.details = ErrorUtils._getExceptionDetailsMessage(exception);

        // Add to the stack trace if available
        if (exception.stack) {
            error.addToStackFrames(exception.stack);
        }

        return error;
    }

    /*
     * Try to convert an exception to an API error
     */
    private static tryConvertToApiError(exception: any): ApiError | null {

        if (exception instanceof ApiError) {
            return exception as ApiError;
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
        } else {
            const details = e.toString();
            if (details !== {}.toString()) {
                return details;
            } else {
                return '';
            }
        }
    }
}
