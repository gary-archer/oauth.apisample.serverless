/*
 * Framework types used for dependency injection but not exposed to calling applications
 */
export const OAUTHINTERNALTYPES = {
    Configuration: Symbol.for('OAuthConfiguration'),
    OAuthAuthenticator: Symbol.for('OAuthAuthenticator'),
    OAuthAuthorizer: Symbol.for('OAuthAuthorizer'),
};
