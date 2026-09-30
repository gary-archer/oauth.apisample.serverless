/*
 * Plumbing types that can be injected into application logic classes
 */
export const BASETYPES = {
    ExtraClaimsProvider: Symbol.for('ExtraClaimsProvider'),
    LogEntry: Symbol.for('LogEntry'),
    OAuthConfiguration: Symbol.for('OAuthConfiguration'),
};
