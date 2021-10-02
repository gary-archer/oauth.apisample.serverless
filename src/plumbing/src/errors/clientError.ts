
/*
 * An interface to represent client error behaviour
 */
export abstract class ClientError extends Error {

    // Set additional details returned for API 500 errors
    public abstract setExceptionDetails(area: string, instanceId: number, utcTime: string): void;

    // Return the HTTP status code
    public abstract getStatusCode(): number;

    // Return the error code
    public abstract getErrorCode(): string;

    // Return the JSON response format
    public abstract toResponseFormat(): any;

    // Return the JSON log format
    public abstract toLogFormat(): any;
}
