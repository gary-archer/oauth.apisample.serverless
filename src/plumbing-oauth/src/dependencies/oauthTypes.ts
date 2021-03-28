/*
 * OAuth types that can be resolved by lambda authorizers
 */
export const OAUTHTYPES = {
    AuthorizerResult: Symbol.for('AuthorizerResult'),
    Configuration: Symbol.for('Configuration'),
    CustomClaimsProvider: Symbol.for('CustomClaimsProvider'),
    JwksClient: Symbol.for('JwksClient'),
    JwtValidator: Symbol.for('JwtValidator'),
    OAuthAuthenticator: Symbol.for('OAuthAuthenticator'),
};
