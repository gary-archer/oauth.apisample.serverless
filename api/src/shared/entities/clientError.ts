/*
 * An error returned to the API caller
 */
export class ClientError extends Error {

    private _statusCode: number;
    private _errorCode: string;
    private _id: number | null;

    public constructor(statusCode: number, errorCode: string, message: string) {
        super(message);
        this._statusCode = statusCode;
        this._errorCode = errorCode;
        this._id = null;

        // Ensure that instanceof works for this class
        Object.setPrototypeOf(this, new.target.prototype);
    }

    public get statusCode(): number {
        return this._statusCode;
    }

    public get errorCode(): string {
        return this._errorCode;
    }

    public get id(): number | null {
        return this._id;
    }

    public set id(id) {
        this._id = id;
    }

    /*
     * Return an object that can be serialized by calling JSON.stringify
     */
    public toResponseFormat(): any {

        const body: any = {
            code: this._errorCode,
            message: this.message,
        };

        if (this._id) {
            body.id = this._id;
        }

        return body;
    }

    /*
     * Similar to the above but includes the status code
     */
    public toLogFormat(): any {

        return {
            statusCode: this._statusCode,
            body: this.toResponseFormat(),
        };
    }
}
