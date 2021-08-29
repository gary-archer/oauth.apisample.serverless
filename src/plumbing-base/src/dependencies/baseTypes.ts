/*
 * Base types that can be injected
 */
export const BASETYPES = {
    HttpProxy: Symbol.for('HttpProxy'),
    LogEntry: Symbol.for('LogEntry'),
    BaseClaims: Symbol.for('BaseClaims'),
    CustomClaims: Symbol.for('CustomClaims'),
    UserInfoClaims: Symbol.for('UserInfoClaims'),
};
