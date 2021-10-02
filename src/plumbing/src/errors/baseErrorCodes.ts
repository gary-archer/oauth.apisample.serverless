/*
 * A list of base framework error codes
 */
export class BaseErrorCodes {

    public static readonly serverError = 'server_error';

    public static readonly unauthorizedRequest = 'unauthorized';

    public static readonly claimsFailure = 'claims_failure';

    public static readonly exceptionSimulation = 'exception_simulation';

    public static readonly cookieDecryptionError = 'cookie_decryption_failure';

    public static readonly signingKeyDownloadError = 'signing_key_download';

    public static readonly jwksProcessingError = 'jwks_processing';

    public static readonly insufficientScope = 'insufficient_scope';

    public static readonly userinfoFailure = 'userinfo_failure';

    public static readonly userInfoTokenExpired = 'invalid_token';

    public static readonly cacheConnect = 'cache_connect';

    public static readonly cacheRead = 'cache_read';

    public static readonly cacheWrite = 'cache_write';
}
