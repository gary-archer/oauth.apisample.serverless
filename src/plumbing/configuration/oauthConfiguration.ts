/*
 * A holder for OAuth settings
 */
export interface OAuthConfiguration {
    issuer: string;
    audience: string;
    jwksEndpoint: string;
    userInfoEndpoint: string;
}
