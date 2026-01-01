import {ClientError} from './clientError';
import {ErrorFactory} from './errorFactory';
import {ServerError} from './serverError';

// Ranges for random error ids
const MIN_ERROR_ID = 10000;
const MAX_ERROR_ID = 99999;

/*
 * The default implementation of a server error
 */
export class ServerErrorImpl extends ServerError {

    // Standard exception properties to log
    private readonly statusCode: number;
    private readonly errorCode: string;
    private readonly instanceId: number;
    private readonly utcTime: string;
    private details: any;

    /*
     * Construct an error from known fields
     */
    public constructor(errorCode: string, userMessage: string, stack?: string | undefined) {

        super(userMessage);

        // Give fields their default values
        this.statusCode = 500;
        this.errorCode = errorCode;
        this.instanceId = Math.floor(Math.random() * (MAX_ERROR_ID - MIN_ERROR_ID + 1) + MIN_ERROR_ID);
        this.utcTime = new Date().toISOString();
        this.details = '';

        // Record the stack trace of the original error
        if (stack) {
            this.stack = stack;
        }

        // Ensure that instanceof works
        Object.setPrototypeOf(this, new.target.prototype);
    }

    public getErrorCode(): string {
        return this.errorCode;
    }

    public getInstanceId(): number {
        return this.instanceId;
    }

    public getDetails(): any {
        return this.details;
    }

    public setDetails(details: any): void {
        this.details = details;
    }

    /*
     * Return an object ready to log
     */
    public toLogFormat(apiName: string): any {

        const serviceError: any = {
            details: this.details,
        };

        // Include the stack trace as an array within the JSON object
        if (this.stack) {

            const frames: string[] = [];
            const items = this.stack.split('\n').map((x: string) => x.trim());
            items.forEach((i) => {
                frames.push(i);
            });

            serviceError.stack = frames;
        }

        return {
            statusCode: this.statusCode,
            clientError: this.toClientError(apiName).toResponseFormat(),
            serviceError,
        };
    }

    /*
     * Translate to a supportable error response to return to the API caller
     */
    public toClientError(apiName: string): ClientError {

        // Return the error code to the client
        const error = ErrorFactory.createClientError(this.statusCode, this.errorCode, this.message);

        // Also indicate which API, where in logs and when the error occurred
        error.setExceptionDetails(apiName, this.instanceId, this.utcTime);
        return error;
    }
}
