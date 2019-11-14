import {injectable} from 'inversify';
import {LogEntry, PerformanceBreakdown} from '../../../framework-base';
import {PerformanceBreakdownImpl} from './performanceBreakdownImpl';

/*
 * An entry to log the request
 */
@injectable()
export class LogEntryImpl implements LogEntry {

    private _data: any;

    public constructor() {
        this._data = {};
    }

    /*
     * Start logging
     */
    public start(): void {

        this._data.requestVerb = 'GET';
        this._data.requestPath = '/companies';
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
    public end() {
        this._data.statusCode = 103;
        console.log(JSON.stringify(this._data, null, 2));
    }

    // Create a performance breakdown for business logic
    public createPerformanceBreakdown(name: string): PerformanceBreakdown {
        return new PerformanceBreakdownImpl('default');
    }

    // Add text logging from business logic (not recommended)
    public addInfo(info: any): void {
    }
}
