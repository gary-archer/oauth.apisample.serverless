import {ClientError} from './clientError.js';

/*
 * The default implementation of a client error
 */
export class ClientErrorImpl extends ClientError {

    // Fields in all client errors
    private readonly statusCode: number;
    private readonly errorCode: string;
    private logContext: any;

    // Extra fields for 500 errors
    private area: string;
    private id: number;
    private utcTime: string;

    /*
     * Construct from mandatory fields
     */
    public constructor(statusCode: number, errorCode: string, message: string) {

        // Set common fields
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.logContext = null;

        // Initialise 5xx fields
        this.area = '';
        this.id = 0;
        this.utcTime = '';

        // Ensure that instanceof works
        Object.setPrototypeOf(this, new.target.prototype);
    }

    public getStatusCode(): number {
        return this.statusCode;
    }

    public getErrorCode(): string {
        return this.errorCode;
    }

    /*
     * Set additional data against an error for logging
     */
    public setLogContext(value: any): void {
        this.logContext = value;
    }

    /*
     * Return the additional data
     */
    public getLogContext(): any {
        return this.logContext;
    }

    /*
     * Set extra fields to return to the caller for 500 errors
     */
    public setExceptionDetails(area: string, id: number, utcTime: string): void {
        this.area = area;
        this.id = id;
        this.utcTime = utcTime;
    }

    /*
     * Return an object that can be serialized by calling JSON.stringify
     */
    public toResponseFormat(): any {

        const body: any = {
            code: this.errorCode,
            message: this.message,
        };

        if (this.id > 0 && this.area.length > 0 && this.utcTime.length > 0) {
            body.id = this.id;
            body.area = this.area;
            body.utcTime = this.utcTime;
        }

        return body;
    }

    /*
     * The log format contains the response body, the status code and optional context
     */
    public toLogFormat(): any {

        const data: any = {
            statusCode: this.statusCode,
            clientError: this.toResponseFormat(),
        };

        if (this.logContext) {
            data.context = this.logContext;
        }

        return data;
    }
}
