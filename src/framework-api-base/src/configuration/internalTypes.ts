/*
 * API framework types used for dependency injection but not exposed to application code
 */
export const INTERNALTYPES = {
    RequestContextAuthenticator: Symbol.for('RequestContextAuthenticator'),
};
