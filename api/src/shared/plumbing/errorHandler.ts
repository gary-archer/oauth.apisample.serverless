import {ApiError} from '../entities/apiError';
import {ClientError} from '../entities/clientError';
import {ApiLogger} from './apiLogger';

/*
 * A class to handle composing and reporting errors
 */
export class ErrorHandler {

    /*
     * Handle the server error and get client details
     */
    public static handleError(serverError: ApiError): [number, ClientError] {

        // Log the full error to the service
        ApiLogger.error(serverError.toJson());

        // Create details for the client
        const clientStatusCode = 500;
        const clientError = {
            area: serverError.area,
            message: serverError.message,
            id: serverError.instanceId,
        } as ClientError;

        return [clientStatusCode, clientError];
    }

    /*
     * Ensure that all errors are of ApiError exception type
     */
    public static fromException(exception: any): ApiError {

        // Already handled
        if (exception instanceof ApiError) {
            return exception;
        }

        // Well coded errors should derive from this base class
        if (exception instanceof Error) {

            const apiError = new ApiError({
                message: `Problem encountered`,
                area: 'Exception',
                details: exception.message,
            });
            apiError.stack = exception.stack;
            return apiError;
        }

        // For other errors we just call toString
        return new ApiError({
            message: 'Problem encountered',
            area: 'Exception',
            details: exception.toString(),
        });
    }

    /*
     * Handle the request promise error for metadata lookup failures
     */
    public static fromMetadataError(responseError: any, url: string): ApiError {

        const apiError = new ApiError({
            statusCode: 500,
            area: 'Metadata Lookup',
            url,
            message: 'Metadata lookup failed',
        });
        ErrorHandler._updateErrorFromHttpResponse(apiError, responseError);
        return apiError;
    }

    /*
     * Handle the request promise error for introspection failures
     */
    public static fromIntrospectionError(responseError: any, url: string): ApiError {

        const apiError = new ApiError({
            statusCode: 500,
            area: 'Token Validation',
            url,
            message: 'Token validation failed',
        });
        ErrorHandler._updateErrorFromHttpResponse(apiError, responseError);
        return apiError;
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
            statusCode: 500,
            area: 'User Info',
            url,
            message: 'User info lookup failed',
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
