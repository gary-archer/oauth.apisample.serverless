"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * A class to handle validating tokens received by the API
 */
class ApiLogger {
    /*
     * Log info level
     */
    static info(...args) {
        console.log(ApiLogger._getText(args));
    }
    /*
     * Log warn level
     */
    static warn(...args) {
        console.log(ApiLogger._getText(args));
    }
    /*
     * Log error level
     */
    static error(...args) {
        console.log(ApiLogger._getText(args));
    }
    /*
     * Get the text to output
     */
    static _getText(args) {
        const text = Array.prototype.slice.call(args).join(' : ');
        return text;
    }
}
exports.ApiLogger = ApiLogger;
