/*
 * A holder for cookie related settings
 */
export interface CookieConfiguration {
    trustedWebOrigins: string[];
    cookiePrefix: string;
    cookieDecryptionKey: string;
}
