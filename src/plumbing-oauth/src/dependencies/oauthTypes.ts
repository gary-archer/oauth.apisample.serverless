/*
 * OAuth types that can be resolved by lambda authorizers
 */
export const OAUTHTYPES = {
    AuthorizerResult: Symbol.for('AuthorizerResult'),
    Configuration: Symbol.for('Configuration'),
    ClaimsProvider: Symbol.for('ClaimsProvider'),
    JwksRetriever: Symbol.for('JwksRetriever'),
    JwtValidator: Symbol.for('JwtValidator'),
    OAuthAuthenticator: Symbol.for('OAuthAuthenticator'),
    AccessTokenRetriever: Symbol.for('AccessTokenRetriever'),
};
