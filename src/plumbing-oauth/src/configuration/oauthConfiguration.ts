/*
 * A holder for OAuth settings
 */
export interface OAuthConfiguration {
    issuer: string;
    jwksEndpoint: string;
    userInfoEndpoint: string;
}
