/*
 * Plumbing types that can be injected
 */
export const BASETYPES = {
    BaseClaims: Symbol.for('BaseClaims'),
    Cache: Symbol.for('Cache'),
    ClaimsProvider: Symbol.for('ClaimsProvider'),
    CustomClaims: Symbol.for('CustomClaims'),
    HttpProxy: Symbol.for('HttpProxy'),
    JwksRetriever: Symbol.for('JwksRetriever'),
    LogEntry: Symbol.for('LogEntry'),
    OAuthAuthenticator: Symbol.for('OAuthAuthenticator'),
    OAuthConfiguration: Symbol.for('OAuthConfiguration'),
    UserInfoClaims: Symbol.for('UserInfoClaims'),
};
