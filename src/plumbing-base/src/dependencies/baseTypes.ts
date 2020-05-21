/*
 * Base types that can be injected
 */
export const BASETYPES = {
    LogEntry: Symbol.for('LogEntry'),
    CoreApiClaims: Symbol.for('CoreApiClaims'),
    RequestContextAuthenticator: Symbol.for('RequestContextAuthenticator'),
};
