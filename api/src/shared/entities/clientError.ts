/*
 * An error returned to the API caller
 */
export class ClientError extends Error {

    private _statusCode: number;
    private _area: string;
    private _id: number | null;

    public constructor(statusCode: number, area: string, message: string) {
        super(message);
        this._statusCode = statusCode;
        this._area = area;
        this._id = null;

        // Ensure that instanceof works
        Object.setPrototypeOf(this, new.target.prototype);
    }

    public get statusCode(): number {
        return this._statusCode;
    }

    public get area(): string {
        return this._area;
    }

    public get id(): number | null {
        return this._id;
    }

    public set id(id) {
        this._id = id;
    }

    public asSerializable(): any {

        if (this._id) {
            return {
                message: this.message,
                area: this._area,
                id: this._id,
            };
        } else {
            return {
                message: this.message,
                area: this._area,
            };
        }

    }

    public toClientError(): ClientError {
        return this;
    }
}
