/*
 * OAuth types that can be resolved by lambda authorizers
 */
export const OAUTHTYPES = {
    AuthorizerResult: Symbol.for('AuthorizerResult'),
    Configuration: Symbol.for('Configuration'),
    OAuthAuthenticator: Symbol.for('OAuthAuthenticator'),
    ClaimsSupplier: Symbol.for('ClaimsSupplier'),
};
