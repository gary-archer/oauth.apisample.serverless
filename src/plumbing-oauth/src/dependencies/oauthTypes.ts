/*
 * OAuth types that can be resolved by lambda authorizers
 */
export const OAUTHTYPES = {
    AuthorizerResult: Symbol.for('AuthorizerResult'),
    Configuration: Symbol.for('Configuration'),
    CustomClaimsProvider: Symbol.for('CustomClaimsProvider'),
    OAuthAuthenticator: Symbol.for('OAuthAuthenticator'),
};
