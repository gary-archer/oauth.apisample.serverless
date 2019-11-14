import {ApiError, DefaultClientError} from '../../../framework-api-base';

/*
 * OAuth specific error processing
 */
export class ErrorUtils {

    /*
     * Handle metadata lookup failures
     */
    public static fromMetadataError(responseError: any, url: string): ApiError {

        const apiError = new ApiError('metadata_lookup_failure', 'Metadata lookup failed');
        ErrorUtils._setErrorDetails(apiError, null, responseError, url);
        return apiError;
    }

    /*
     * Handle user info lookup failures
     */
    public static fromUserInfoError(responseError: any, url: string): ApiError {

        // Handle a race condition where the access token expires during user info lookup
        if (responseError.error && responseError.error === 'invalid_token') {
            throw DefaultClientError.create401('Access token expired during user info lookup');
        }

        // Avoid reprocessing
        if (responseError instanceof ApiError) {
            return responseError;
        }

        const [code, description] = ErrorUtils._readOAuthErrorResponse(responseError);
        const apiError = ErrorUtils._createOAuthApiError('userinfo_failure', 'User info lookup failed', code);
        ErrorUtils._setErrorDetails(apiError, description, responseError, url);
        return apiError;
    }

    /*
     * The error thrown if we cannot find an expected claim during security handling
     */
    public static fromMissingClaim(claimName: string): ApiError {

        const apiError = new ApiError('claims_failure', 'Authorization Data Not Found');
        apiError.details = `An empty value was found for the expected claim ${claimName}`;
        return apiError;
    }

    /*
     * Return the error and error_description fields from an OAuth error message if present
     */
    private static _readOAuthErrorResponse(responseError: any): [string | null, string | null] {

        let code = null;
        let description = null;

        if (responseError.error) {
            code = responseError.error;
        }

        if (responseError.error_description) {
            description = responseError.error_description;
        }

        return [code, description];
    }

    /*
     * Create an error object from an error code and include the OAuth error code in the user message
     */
    private static _createOAuthApiError(
        errorCode: string,
        userMessage: string,
        oauthErrorCode: string | null): ApiError {

        // Include the OAuth error code in the short technical message returned
        let message = userMessage;
        if (errorCode) {
            message += ` : ${oauthErrorCode}`;
        }

        return new ApiError(errorCode, message);
    }

    /*
     * Update the API error object with technical exception details
     */
    private static _setErrorDetails(
        error: ApiError,
        oauthDetails: string | null,
        responseError: any,
        url: string): void {

        // First set details
        let detailsText = '';
        if (oauthDetails) {
            detailsText += oauthDetails;
        } else {
            detailsText += ErrorUtils._getExceptionDetailsMessage(responseError);
        }

        if (url) {
            detailsText += `, URL: ${url}`;
        }
        error.details = detailsText;

        // Next include the original call stack
        if (responseError.stack) {
            error.addToStackFrames(responseError.stack);
        }
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
