import {BaseErrorCodes} from './baseErrorCodes.js';
import {ClientError} from './clientError.js';
import {ErrorFactory} from './errorFactory.js';
import {ServerError} from './serverError.js';

/*
 * Error utility functions for OAuth and general processing
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

        error.setDetails(ErrorUtils.getExceptionDetailsMessage(exception));
        return error;
    }

    /*
     * Handle the error for key identifier lookups
     */
    public static fromSigningKeyDownloadError(responseError: any, url: string): ServerError {

        const error = ErrorFactory.createServerError(
            BaseErrorCodes.signingKeyDownloadError,
            'Problem downloading token signing keys',
            responseError.stack);

        const details = ErrorUtils.getExceptionDetailsMessage(responseError);
        error.setDetails(`${details}, URL: ${url}`);
        return error;
    }

    /*
     * Handle other errors during JWKS processing
     */
    public static fromJwksProcessingError(exception: any): ServerError {

        const error = ErrorFactory.createServerError(
            BaseErrorCodes.jwksProcessingError,
            'JWKS processing failed',
            exception.stack);

        error.setDetails(ErrorUtils.getExceptionDetailsMessage(exception));
        return error;
    }

    /*
     * The error thrown if we cannot find an expected claim during security handling
     */
    public static fromMissingClaim(claimName: string): ServerError {

        const error = ErrorFactory.createServerError(BaseErrorCodes.claimsFailure, 'Authorization Data Not Found');
        error.setDetails(`An empty value was found for the expected claim '${claimName}'`);
        return error;
    }

    /*
     * The error thrown if we have problems interacting with the cache
     */
    public static fromCacheError(errorCode: string, exception: any): ServerError {

        const error = ErrorFactory.createServerError(errorCode, 'Problem encountered during a cache operation');
        error.setDetails(ErrorUtils.getExceptionDetailsMessage(exception));
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
    public static getExceptionDetailsMessage(e: any): string {

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
