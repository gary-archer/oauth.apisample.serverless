/*
 * A holder for OAuth settings
 */
export interface OAuthConfiguration {
    issuer: string;
    audience: string;
    algorithm: string;
    jwksEndpoint: string;
    userInfoEndpoint: string;
    cookiePrefix: string;
    cookieDecryptionKey: string;
}
