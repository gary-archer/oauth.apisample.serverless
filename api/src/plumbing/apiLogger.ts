/*
 * A class to handle validating tokens received by the API
 */
export class ApiLogger {

    /*
     * Initialize the logger
     */
    public static initialize(): void {
    }

    /*
     * Log info level
     */
    public static info(...args: any[]): void {
        console.log(ApiLogger._getText(args));
    }

    /*
     * Log warn level
     */
    public static warn(...args: any[]): void {
        console.log(ApiLogger._getText(args));
    }

    /*
     * Log error level
     */
    public static error(...args: any[]): void {
        console.log(ApiLogger._getText(args));
    }

    /*
     * Get the text to output
     */
    private static _getText(args: any): string {
        const text = Array.prototype.slice.call(args).join(' : ');
        return text;
    }
}
