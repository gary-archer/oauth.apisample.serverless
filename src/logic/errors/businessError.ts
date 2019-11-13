/*
 * A 4xx error type that is not REST specific and can be thrown from business logic
 */
export class BusinessError extends Error {

    private readonly _errorCode: string;

    public constructor(errorCode: string, errorMessage: string) {
        super(errorMessage);
        this._errorCode = errorCode;
    }

    public get code(): string {
        return this._errorCode;
    }
}
