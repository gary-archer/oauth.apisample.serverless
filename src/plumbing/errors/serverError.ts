import {ClientError} from './clientError';

/*
 * An interface for errors internal to the API
 */
export abstract class ServerError extends Error {

    // Return the error code
    public abstract getErrorCode(): string;

    // Return an instance id used for error lookup
    public abstract getInstanceId(): number;

    // Return details to be updated
    public abstract getDetails(details: any): void;

    // Set details
    public abstract setDetails(details: any): void;

    // Return the log format
    public abstract toLogFormat(apiName: string): any;

    // Return the client error for the server error
    public abstract toClientError(apiName: string): ClientError;
}
