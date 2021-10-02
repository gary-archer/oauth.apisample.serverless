/*
 * A list of base framework error codes
 */
export class BaseErrorCodes {

    public static readonly serverError = 'server_error';

    public static readonly unauthorizedRequest = 'unauthorized';

    public static readonly claimsFailure = 'claims_failure';

    public static readonly exceptionSimulation = 'exception_simulation';

    public static readonly cookieDecryptionError = 'cookie_decryption_failure';

    public static readonly signingKeyDownloadFailure = 'signing_key_download';

    public static readonly insufficientScope = 'insufficient_scope';

    public static readonly userinfoFailure = 'userinfo_failure';

    public static readonly userInfoTokenExpired = 'invalid_token';
}
