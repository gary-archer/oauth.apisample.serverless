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
    private readonly _statusCode: number;
    private readonly _errorCode: string;
    private readonly _instanceId: number;
    private readonly _utcTime: string;
    private _details: any;

    /*
     * Construct an error from known fields
     */
    public constructor(errorCode: string, userMessage: string, stack?: string | undefined) {

        super(userMessage);

        // Give fields their default values
        this._statusCode = 500;
        this._errorCode = errorCode;
        this._instanceId = Math.floor(Math.random() * (MAX_ERROR_ID - MIN_ERROR_ID + 1) + MIN_ERROR_ID);
        this._utcTime = new Date().toISOString();
        this._details = '';

        // Record the stack trace of the original error
        if (stack) {
            this.stack = stack;
        }

        // Ensure that instanceof works
        Object.setPrototypeOf(this, new.target.prototype);
    }

    public getErrorCode(): string {
        return this._errorCode;
    }

    public getInstanceId(): number {
        return this._instanceId;
    }

    public getDetails(): any {
        return this._details;
    }

    public setDetails(details: any): void {
        this._details = details;
    }

    /*
     * Return an object ready to log
     */
    public toLogFormat(apiName: string): any {

        const serviceError: any = {
            details: this._details,
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
            statusCode: this._statusCode,
            clientError: this.toClientError(apiName).toResponseFormat(),
            serviceError,
        };
    }

    /*
     * Translate to a supportable error response to return to the API caller
     */
    public toClientError(apiName: string): ClientError {

        // Return the error code to the client
        const error = ErrorFactory.createClientError(this._statusCode, this._errorCode, this.message);

        // Also indicate which API, where in logs and when the error occurred
        error.setExceptionDetails(apiName, this._instanceId, this._utcTime);
        return error;
    }
}
