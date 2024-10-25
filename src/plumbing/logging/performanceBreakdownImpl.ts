import {PerformanceBreakdown} from './performanceBreakdown.js';

/*
 * The full implementation class is private to the framework and excluded from the index.ts file
 */
export class PerformanceBreakdownImpl implements PerformanceBreakdown {

    private readonly name: string;
    private startTime!: [number, number];
    private millisecondsTaken: number;
    private details: any;
    private children: PerformanceBreakdownImpl[];

    public constructor(name: string) {
        this.name = name;
        this.children = [];
        this.millisecondsTaken = 0;
        this.details = '';
    }

    /*
     * Start a performance measurement after creation
     */
    public start(): void {
        this.startTime = process.hrtime();
    }

    /*
     * Set details to associate with the performance breakdown
     * One use case would be to log SQL with input parameters
     */
    public setDetails(value: any): void {
        this.details = value;
    }

    /*
     * Stop the timer and finish the measurement, converting nanoseconds to milliseconds
     */
    public dispose(): void {

        const endTime = process.hrtime(this.startTime);
        this.millisecondsTaken = Math.floor((endTime[0] * 1000000000 + endTime[1]) / 1000000);
    }

    /*
     * Return the time taken
     */
    public getMillisecondsTaken(): number {
        return this.millisecondsTaken;
    }

    /*
     * Used when a parent log entry's is updated to exclude child performance
     */
    public setMillisecondsTaken(value: number): void {
        this.millisecondsTaken = value;
    }

    /*
     * Return data as an object
     */
    public get data(): any {

        const data: any = {
            name: this.name,
            millisecondsTaken: this.millisecondsTaken,
        };

        if (this.details) {
            data.details = this.details;
        }

        if (this.children.length > 0) {
            data.children = [];
            this.children.forEach((child) => data.children.push(child.data));
        }

        return data;
    }

    /*
     * Add a child to the performance breakdown
     */
    public createChild(name: string): PerformanceBreakdownImpl {

        const child = new PerformanceBreakdownImpl(name);
        this.children.push(child);
        return child;
    }
}
