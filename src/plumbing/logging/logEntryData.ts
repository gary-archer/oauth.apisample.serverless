import {randomUUID} from 'crypto';
import {PerformanceBreakdownImpl} from './performanceBreakdownImpl.js';

/*
 * Log data collected during the lifetime of an API request
 */
export class LogEntryData {

    // The API generates a unique UUID for each API request
    public id: string;

    // The time when the API received the request
    public utcTime: Date;

    // The name of the API
    public apiName: string;

    // The operation called
    public operationName: string;

    // The host on which the request was processed
    public hostName: string;

    // The HTTP method
    public method: string;

    // The request path including query parameters
    public path: string;

    // The runtime id(s) in the URL path segments
    public resourceId: string;

    // The calling application name
    public clientName: string;

    // The anonymous subject claim from the access token
    public userId: string;

    // The status code returned
    public statusCode: number;

    // The time taken in API code
    public millisecondsTaken: number;

    // A time beyond which performance is considered 'slow'
    public performanceThresholdMilliseconds: number;

    // The error code for requests that failed
    public errorCode: string;

    // The specific error instance id, for 500 errors
    public errorId: number;

    // The correlation id, used to link related API requests together
    public correlationId: string;

    // A session id, to group related calls from a client together
    public sessionId: string;

    // An object containing performance data, written when performance is slow
    public performance: PerformanceBreakdownImpl;

    // An object containing error data, written for failed requests
    public errorData: any;

    // Can be populated in scenarios when extra text is useful
    public infoData: any[];

    // The scope string from the access token
    public scope: string[];

    // The claims from the access token
    public claims: any;

    /*
     * Initialize data with default values
     */
    public constructor() {

        // Queryable fields
        this.id = randomUUID();
        this.utcTime = new Date();
        this.apiName = '';
        this.operationName = '';
        this.hostName = '';
        this.method = '';
        this.resourceId = '';
        this.path = '';
        this.clientName = '';
        this.userId = '';
        this.statusCode = 0;
        this.millisecondsTaken = 0;
        this.performanceThresholdMilliseconds = 0;
        this.errorCode = '';
        this.errorId = 0;
        this.correlationId = '';
        this.sessionId = '';

        // Objects that are not directly queryable
        this.performance = new PerformanceBreakdownImpl('total');
        this.errorData = null;
        this.infoData = [];
        this.scope = [];
        this.claims = null;
    }

    /*
     * Set fields at the end of a log entry
     */
    public finalise(): void {
        this.millisecondsTaken = this.performance.getMillisecondsTaken();
    }

    /*
     * Output technical support details for troubleshooting but without sensitive data
     */
    public toRequestLog(): void {

        // Output fields used as top level queryable columns
        const output: any = {};
        output.type = 'request';
        this.outputString((x) => output.id = x, this.id);
        this.outputString((x) => output.utcTime = x, this.utcTime.toISOString());
        this.outputString((x) => output.apiName = x, this.apiName);
        this.outputString((x) => output.operationName = x, this.operationName);
        this.outputString((x) => output.hostName = x, this.hostName);
        this.outputString((x) => output.method = x, this.method);
        this.outputString((x) => output.path = x, this.path);
        this.outputString((x) => output.resourceId = x, this.resourceId);
        this.outputString((x) => output.clientName = x, this.clientName);
        this.outputString((x) => output.userId = x, this.userId);
        this.outputNumber((x) => output.statusCode = x, this.statusCode);
        this.outputString((x) => output.errorCode = x, this.errorCode);
        this.outputNumber((x) => output.errorId = x, this.errorId);
        this.outputNumber((x) => output.millisecondsTaken = x, this.performance.getMillisecondsTaken(), true);
        this.outputString((x) => output.correlationId = x, this.correlationId);
        this.outputString((x) => output.sessionId = x, this.sessionId);

        // Output object data, which is looked up via top level fields
        this.outputPerformance(output);
        this.outputError(output);
        this.outputInfo(output);
        return output;
    }

    /*
     * Output audit logs for security visibility but without troubleshooting data
     */
    public toAuditLog(): void {

        const output: any = {};
        output.type = 'audit';
        this.outputString((x) => output.id = x, this.id);
        this.outputString((x) => output.utcTime = x, this.utcTime.toISOString());
        this.outputString((x) => output.apiName = x, this.apiName);
        this.outputString((x) => output.operationName = x, this.operationName);
        this.outputString((x) => output.hostName = x, this.hostName);
        this.outputString((x) => output.method = x, this.method);
        this.outputString((x) => output.path = x, this.path);
        this.outputString((x) => output.resourceId = x, this.resourceId);
        this.outputString((x) => output.clientName = x, this.clientName);
        this.outputString((x) => output.userId = x, this.userId);
        this.outputNumber((x) => output.statusCode = x, this.statusCode);
        this.outputString((x) => output.errorCode = x, this.errorCode);
        this.outputString((x) => output.sessionId = x, this.sessionId);

        output.isAuthenticated = !!this.userId;
        output.isAuthorized = output.isAuthenticated && (this.statusCode >= 200 && this.statusCode <= 299);

        if (this.scope.length > 0) {
            output.scope = this.scope;
        }

        if (this.claims) {
            output.claims = this.claims;
        }

        return output;
    }

    /*
     * Add a string to the output unless empty
     */
    private outputString(setter: (val: string) => void, value: string): void {

        if (value && value.length > 0) {
            setter(value);
        }
    }

    /*
     * Add a number to the output unless zero or forced
     */
    private outputNumber(setter: (val: number) => void, value: number, force = false): void {

        if (value > 0 || force) {
            setter(value);
        }
    }

    /*
     * Add the performance breakdown if the threshold has been exceeded
     */
    private outputPerformance(output: any): void {

        if (this.performance.getMillisecondsTaken() >= this.performanceThresholdMilliseconds) {
            output.performance = this.performance.data;
        }
    }

    /*
     * Add error details if applicable
     */
    private outputError(output: any): void {

        if (this.errorData !== null) {
            output.errorData = this.errorData;
        }
    }

    /*
     * Add info details if applicable
     */
    private outputInfo(data: any): void {

        if (this.infoData.length > 0) {
            data.infoData = this.infoData;
        }
    }
}
