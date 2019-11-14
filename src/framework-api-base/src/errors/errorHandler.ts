import {LogEntryImpl} from '../logging/logEntryImpl';
import {ApiError} from './apiError';
import {IClientError} from './iclientError';

/*
 * A class to handle composing and reporting errors
 */
export class ErrorHandler {

    public static readonly apiName = 'SampleApi';

    /*
     * Special logic for startup errors
     */
    public static handleStartupError(exception: any): IClientError {

        const log = new LogEntryImpl();
        const apiError = ErrorHandler.createApiError(exception);
        log.error(apiError.toLogFormat(ErrorHandler.apiName));
        log.end();

        return apiError.toClientError(ErrorHandler.apiName);
    }

    /*
     * Return or create a typed error
     */
    public static handleError(exception: any, log: LogEntryImpl): ApiError | IClientError {

        let apiError = this.tryConvertToApiError(exception);
        if (apiError !== null) {
            log.error(apiError.toLogFormat(ErrorHandler.apiName));
            return apiError;
        }

        const clientError = this.tryConvertToClientError(exception);
        if (clientError !== null) {
            log.error(clientError.toLogFormat());
            return clientError;
        }

        apiError = ErrorHandler.createApiError(exception);
        log.error(apiError.toLogFormat(ErrorHandler.apiName));
        return apiError;
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
        error.details = ErrorHandler.getExceptionDetailsMessage(exception);

        // Add to the stack trace if available
        if (exception.stack) {
            error.addToStackFrames(exception.stack);
        }

        return error;
    }

    /*
     * Try to convert an exception to a known type
     */
    public static tryConvertToApiError(exception: any): ApiError | null {

        if (exception instanceof ApiError) {
            return exception as ApiError;
        }

        return null;
    }

    /*
     * Try to convert an exception to an interface
     * We have to use a TypeScript specific method of checking for known members
     */
    public static tryConvertToClientError(exception: any): IClientError | null {

        if (exception.getStatusCode && exception.toResponseFormat && exception.toLogFormat) {
            return exception as IClientError;
        }

        return null;
    }

    /*
     * Handle the request promise error for metadata lookup failures
     */
    public static fromMetadataError(responseError: any, url: string): ApiError {

        const apiError = new ApiError('metadata_lookup_failure', 'Metadata lookup failed');
        ErrorHandler._updateErrorFromHttpResponse(apiError, responseError);
        return apiError;
    }

    /*
     * Handle the error for key identifier lookups
     */
    public static fromSigningKeyDownloadError(responseError: any, url: string): ApiError {

        const apiError = new ApiError('signing_key_download', 'Signing key download failed');
        ErrorHandler._updateErrorFromHttpResponse(apiError, responseError);
        return apiError;
    }

    /*
     * Handle user info lookup failures
     */
    public static fromUserInfoError(responseError: any, url: string): ApiError {

        const apiError = new ApiError('userinfo_failure', 'User info lookup failed');
        ErrorHandler._updateErrorFromHttpResponse(apiError, responseError);
        return apiError;
    }

    /*
     * Update error fields with response details
     */
    private static _updateErrorFromHttpResponse(apiError: ApiError, responseError: any): void {

        if (responseError.error && responseError.error_description) {

            // Include OAuth error details if returned
            apiError.message += ` : ${responseError.error}`;
            apiError.details = responseError.error_description;
        } else {

            // Otherwise capture exception details
            apiError.details = responseError.toString();
        }
    }

    /*
     * Get the message from an exception and avoid returning [object Object]
     */
    private static getExceptionDetailsMessage(e: any): string {

        if (e.message) {
            return e.message;
        } else {
            const details = e.toString();
            if (details !== {}.toString()) {
                return details;
            } else {
                return 'Unable to read error details from exception';
            }
        }
    }
}
