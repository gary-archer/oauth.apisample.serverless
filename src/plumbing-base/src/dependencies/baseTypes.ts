/*
 * Base types that can be injected
 */
export const BASETYPES = {
    LogEntry: Symbol.for('LogEntry'),
    CustomClaims: Symbol.for('CustomApiClaims'),
    TokenClaims: Symbol.for('TokenApiClaims'),
    UserInfoClaims: Symbol.for('UserInfoApiClaims'),
};
