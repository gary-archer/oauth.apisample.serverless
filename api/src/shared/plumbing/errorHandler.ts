import {ApiError} from '../entities/apiError';
import {ClientError} from '../entities/clientError';
import {RequestLogger} from './requestLogger';

/*
 * A class to handle composing and reporting errors
 */
export class ErrorHandler {

    /*
     * Handle the server error and get client details
     */
    public static handleError(exception: any, log: RequestLogger): ClientError {

        // Ensure that the exception has a known type
        const handledError = ErrorHandler.fromException(exception);
        if (exception instanceof ClientError) {

            // Client errors mean the caller did something wrong
            const clientError = handledError as ClientError;

            // Log the error
            log.error(clientError.toLogFormat());

            // Return the API response to the caller
            return clientError;

        } else {

            // API errors mean we experienced a failure
            const apiError = handledError as ApiError;

            // Log the error with an id
            log.error(apiError.toLogFormat());

            // Return the API response to the caller
            return apiError.toClientError();
        }
    }

    /*
     * Ensure that all errors are of a known type
     */
    public static fromException(exception: any): ApiError | ClientError {

        // Already handled 500 errors
        if (exception instanceof ApiError) {
            return exception;
        }

        // Already handled 4xx errors
        if (exception instanceof ClientError) {
            return exception;
        }

        // Well coded errors should derive from this base class
        if (exception instanceof Error) {

            const apiError = new ApiError({
                errorCode: 'server_error',
                message: `Problem encountered`,
                details: exception.message,
            });
            apiError.stack = exception.stack;
            return apiError;
        }

        // For other errors we just call toString
        return new ApiError({
            errorCode: 'server_error',
            message: 'Problem encountered',
            details: exception.toString(),
        });
    }

    /*
     * Handle the request promise error for metadata lookup failures
     */
    public static fromMetadataError(responseError: any, url: string): ApiError {

        const apiError = new ApiError({
            errorCode: 'metadata_lookup',
            message: 'Metadata lookup failed',
            url,
        });
        ErrorHandler._updateErrorFromHttpResponse(apiError, responseError);
        return apiError;
    }

    /*
     * Handle the error for key identifier lookups
     */
    public static fromSigningKeyDownloadError(responseError: any, url: string): ApiError {

        return new ApiError({
            errorCode: 'signing_key_download',
            message: 'Signing key download failed',
            url,
            details: responseError,
        });
    }

    /*
     * Handle user info lookup failures
     */
    public static fromUserInfoError(responseError: any, url: string): ApiError {

        // Already handled expired errors
        if (responseError instanceof ApiError) {
            return responseError;
        }

        const apiError = new ApiError({
            errorCode: 'user_info_lookup',
            message: 'User info lookup failed',
            url,
        });
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
}
