/*
 * Error codes specific to extracting tokens from cookies
 */
export class CookieErrorCodes {

    public static readonly missingWebOrigin = 'missing_web_origin';

    public static readonly untrustedWebOrigin = 'untrusted_web_origin';

    public static readonly cookieNotFoundError = 'cookie_not_found';

    public static readonly cookieDecryptionError = 'cookie_decryption_error';

    public static readonly missingAntiForgeryTokenError = 'missing_csrf_token';

    public static readonly mismatchedAntiForgeryTokenError = 'mismatched_csrf_token';

    public static readonly formFieldNotFoundError = 'form_field_not_found';
}
