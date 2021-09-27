import {BaseErrorCodes, ClientError, ErrorFactory, ServerError} from '../../../plumbing-base';
import {OAuthErrorCodes} from './oauthErrorCodes';

/*
 * OAuth specific error processing
 */
export class OAuthErrorUtils {

    /*
     * Handle the error for key identifier lookups
     */
    public static fromCookieDecryptionError(cookieName: string, ex: any): ClientError {

        const message = ex.message ? ex.message : '';
        return ErrorFactory.createClient401Error(`Problem encountered decrypting ${cookieName} cookie: ${message}`);
    }

    /*
     * Handle the error for anti forgery mismatches
     */
    public static fromAntiForgeryError(): ClientError {

        return ErrorFactory.createClient401Error(
            'Problem encountered verifying anti forgery cookie against request header');
    }

    /*
     * Handle the error for key identifier lookups
     */
    public static fromSigningKeyDownloadError(responseError: any, url: string): ServerError {

        const error = ErrorFactory.createServerError(
            OAuthErrorCodes.signingKeyDownloadFailure,
            'Signing key download failed',
            responseError.stack);

        OAuthErrorUtils._setErrorDetails(error, null, responseError, url);
        return error;
    }

    /*
     * Handle user info lookup failures
     */
    public static fromUserInfoError(responseError: any, url: string): ServerError {

        // Handle a race condition where the access token expires during user info lookup
        if (responseError.error && responseError.error === OAuthErrorCodes.userInfoTokenExpired) {
            throw ErrorFactory.createClient401Error('Access token expired during user info lookup');
        }

        // Avoid reprocessing
        if (responseError instanceof ServerError) {
            return responseError;
        }

        const [code, description] = OAuthErrorUtils._readOAuthErrorResponse(responseError);
        const error = OAuthErrorUtils._createOAuthServerError(
            OAuthErrorCodes.userinfoFailure,
            'User info lookup failed',
            code,
            responseError.stack);

        OAuthErrorUtils._setErrorDetails(error, description, responseError, url);
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
    private static _createOAuthServerError(
        errorCode: string,
        userMessage: string,
        oauthErrorCode: string | null,
        stack: string | undefined): ServerError {

        // Include the OAuth error code in the short technical message returned
        let message = userMessage;
        if (errorCode) {
            message += ` : ${oauthErrorCode}`;
        }

        return ErrorFactory.createServerError(errorCode, message, stack);
    }

    /*
     * Update the server error object with technical exception details
     */
    private static _setErrorDetails(
        error: ServerError,
        oauthDetails: string | null,
        responseError: any,
        url: string): void {

        // First set details
        let detailsText = '';
        if (oauthDetails) {
            detailsText += oauthDetails;
        } else {
            detailsText += OAuthErrorUtils._getExceptionDetailsMessage(responseError);
        }

        if (url) {
            detailsText += `, URL: ${url}`;
        }
        error.setDetails(detailsText);
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
