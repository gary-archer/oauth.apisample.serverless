/*
 * Injectable interfaces must use a symbol, due to JavaScript type erasure
 */
export const INTERFACES = {
    LogEntry: Symbol.for('LogEntry'),
    OAuthConfiguration: Symbol.for('OAuthConfiguration'),
};
