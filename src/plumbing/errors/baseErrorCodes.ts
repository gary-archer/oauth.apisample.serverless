/*
 * A list of base framework error codes related to OAuth or other errors
 */
export class BaseErrorCodes {

    public static readonly serverError = 'server_error';

    public static readonly invalidToken = 'invalid_token';

    public static readonly exceptionSimulation = 'exception_simulation';

    public static readonly signingKeyDownloadError = 'signing_key_download';

    public static readonly jwksProcessingError = 'jwks_processing';

    public static readonly insufficientScope = 'insufficient_scope';

    public static readonly insufficientData = 'insufficient_data';

    public static readonly cacheConnect = 'cache_connect';

    public static readonly cacheRead = 'cache_read';

    public static readonly cacheWrite = 'cache_write';
}
