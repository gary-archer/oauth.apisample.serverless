/*
 * Plumbing types that can be injected
 */
export const BASETYPES = {
    AccessTokenRetriever: Symbol.for('AccessTokenRetriever'),
    BaseClaims: Symbol.for('BaseClaims'),
    ClaimsProvider: Symbol.for('ClaimsProvider'),
    CustomClaims: Symbol.for('CustomClaims'),
    HttpProxy: Symbol.for('HttpProxy'),
    JwksRetriever: Symbol.for('JwksRetriever'),
    JwtValidator: Symbol.for('JwtValidator'),
    LogEntry: Symbol.for('LogEntry'),
    OAuthAuthenticator: Symbol.for('OAuthAuthenticator'),
    OAuthConfiguration: Symbol.for('OAuthConfiguration'),
    UserInfoClaims: Symbol.for('UserInfoClaims'),
};
