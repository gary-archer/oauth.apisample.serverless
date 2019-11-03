/*
 * The API log is added built during a request and then output
 */
export class RequestLogger {

    private _data: any;

    public constructor() {
        this._data = {};
    }

    /*
     * Add debug info to the log
     */
    public debug(name: string, info: string): void {

        if (!this._data.debug) {
            this._data.debug = [];
        }

        this._data.debug.push(name, info);
    }

    /*
     * Add error details to the log
     */
    public error(error: any): void {
        this._data.error = error;
    }

    /*
     * Output data
     */
    public write() {
        console.log(JSON.stringify(this._data));
    }
}
