/*
 * The API log is added built during a request and then output
 */
export class RequestLog {

    private _data: any;

    public constructor() {
        this._data = {};
    }

    /*
     * Add debug info to the log
     */
    public debug(name: string, info: string): void {

        if (!this._data.info) {
            this._data.info = [];
        }

        this._data.info.push(name, info);
    }

    /*
     * Add error details to the log
     */
    public error(statusCode: number, error: string): void {

        this._data.error = {
            statusCode,
            error,
        };
    }

    /*
     * Output data
     */
    private write() {
        console.log(JSON.stringify(this._data));
    }
}
