/*
 * Some options suitable for our API tests
 */
export class ApiRequestOptions {

    private readonly accessToken: string;
    private httpMethod: string;
    private apiPath: string;
    private rehearseException: boolean;

    public constructor(accessToken: string) {
        this.accessToken = accessToken;
        this.httpMethod = '';
        this.apiPath = '';
        this.rehearseException = false;
    }

    public getAccessToken(): string {
        return this.accessToken;
    }

    public setHttpMethod(value: string): void {
        this.httpMethod = value;
    }

    public getHttpMethod(): string {
        return this.httpMethod;
    }

    public setApiPath(value: string): void {
        this.apiPath = value;
    }

    public getApiPath(): string {
        return this.apiPath;
    }

    public setRehearseException(value: boolean): void {
        this.rehearseException = value;
    }

    public getRehearseException(): boolean {
        return this.rehearseException;
    }
}
