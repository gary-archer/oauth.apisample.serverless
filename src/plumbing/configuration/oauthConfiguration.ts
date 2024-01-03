/*
 * A holder for OAuth settings
 */
export interface OAuthConfiguration {
    issuer: string;
    audience: string;
    algorithm: string;
    scope: string;
    jwksEndpoint: string;
}
