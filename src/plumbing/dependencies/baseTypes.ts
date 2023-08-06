/*
 * Plumbing types that can be injected
 */
export const BASETYPES = {
    AccessTokenValidator: Symbol.for('AccessTokenValidator'),
    Cache: Symbol.for('Cache'),
    ClaimsPrincipal: Symbol.for('ClaimsPrincipal'),
    HttpProxy: Symbol.for('HttpProxy'),
    JwksRetriever: Symbol.for('JwksRetriever'),
    LogEntry: Symbol.for('LogEntry'),
    OAuthConfiguration: Symbol.for('OAuthConfiguration'),
};
