import {PerformanceBreakdown} from '../../../framework-base';

/*
 * The full implementation class is private to the framework and excluded from the index.ts file
 */
export class PerformanceBreakdownImpl implements PerformanceBreakdown {

    private _name: string;
    private _startTime!: [number, number];
    private _millisecondsTaken: number;
    private _details: any;
    private _children: PerformanceBreakdownImpl[];

    /*
     * Set defaults for fields
     */
    public constructor(name: string) {
        this._name = name;
        this._children = [];
        this._millisecondsTaken = 0;
        this._details = '';
    }

    /*
     * Start a performance measurement after creation
     */
    public start(): void {
        this._startTime = process.hrtime();
    }

    /*
     * Set details to associate with the performance breakdown
     * One use case would be to log SQL with input parameters
     */
    public setDetails(value: any): void {
        this._details = value;
    }

    /*
     * Stop the timer and finish the measurement, converting nanoseconds to milliseconds
     */
    public dispose(): void {

        const endTime = process.hrtime(this._startTime);
        this._millisecondsTaken = Math.floor((endTime[0] * 1000000000 + endTime[1]) / 1000000);
    }

    /*
     * Return the time taken
     */
    public get millisecondsTaken(): number {
        return this._millisecondsTaken;
    }

    /*
     * Used when a parent log entry's is updated to exclude child performance
     */
    public set millisecondsTaken(value: number) {
        this._millisecondsTaken = value;
    }

    /*
     * Return data as an object
     */
    public get data(): any {

        const data: any = {
            name: this._name,
            millisecondsTaken: this._millisecondsTaken,
        };

        if (this._details) {
            data.details = this._details;
        }

        if (this._children.length > 0) {
            data.children = [];
            this._children.forEach((child) => data.children.push(child.data));
        }

        return data;
    }

    /*
     * Add a child to the performance breakdown
     */
    public createChild(name: string): PerformanceBreakdownImpl {

        const child = new PerformanceBreakdownImpl(name);
        this._children.push(child);
        return child;
    }
}
