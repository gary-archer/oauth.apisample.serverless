/*
 * An extended error class so that all unexpected errors have an error code, short message and details
 */
export class ExtendedError extends Error {

    private readonly _errorCode: string;
    private _details: any;
    private _exception: any;

    public constructor(errorCode: string, userMessage: string, stack?: string | undefined) {
        super(userMessage);
        this._errorCode = errorCode;
        this._details = '';

        if (stack) {
            this.stack = stack;
        }
    }

    public get code(): string {
        return this._errorCode;
    }

    public get details(): any {
        return this._details;
    }

    public set details(details: any) {
        this._details = details;
    }

    public get exception(): any {
        return this._exception;
    }

    public set exception(exception: any) {
        this._exception = exception;
    }
}
