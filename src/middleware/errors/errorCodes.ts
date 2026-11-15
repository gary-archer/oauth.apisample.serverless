/*
 * Error codes to represent error causes
 */
export class ErrorCodes {

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

    public static readonly invalidCompanyId = 'invalid_company_id';

    public static readonly companyNotFound = 'company_not_found';

    public static readonly fileReadError = 'file_read_error';
}
