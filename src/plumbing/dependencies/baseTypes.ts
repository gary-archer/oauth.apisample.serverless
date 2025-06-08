/*
 * Plumbing types that can be injected into application logic classes
 */
export const BASETYPES = {
    AccessTokenValidator: Symbol.for('AccessTokenValidator'),
    ClaimsCache: Symbol.for('ClaimsCache'),
    ClaimsPrincipal: Symbol.for('ClaimsPrincipal'),
    ExtraClaimsProvider: Symbol.for('ExtraClaimsProvider'),
    HttpProxy: Symbol.for('HttpProxy'),
    JwksRetriever: Symbol.for('JwksRetriever'),
    LogEntry: Symbol.for('LogEntry'),
    OAuthConfiguration: Symbol.for('OAuthConfiguration'),
    OAuthFilter: Symbol.for('OAuthFilter'),
};
