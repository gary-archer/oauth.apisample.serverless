/*
 * A simple error class to represent an exception that can be thrown from business logic
 * Errors are categorized via an error code so that occurrences can be measured over time
 */
export class CustomException extends Error {

    private readonly _errorCode: string;
    private _details: any;
    private _exception: any;

    public constructor(errorCode: string, userMessage: string) {
        super(userMessage);
        this._errorCode = errorCode;
        this._details = '';
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
