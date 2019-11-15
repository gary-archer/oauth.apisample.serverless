import {Context} from 'aws-lambda';
import {Guid} from 'guid-typescript';
import {injectable} from 'inversify';
import * as os from 'os';
import {LogEntry, PerformanceBreakdown} from '../../../framework-base';
import {ApiError} from '../errors/apiError';
import {ClientError} from '../errors/clientError';
import {CoreApiClaims} from '../security/coreApiClaims';
import {LogEntryData} from './logEntryData';

/*
 * A class to manage logging of a lambda request
 */
@injectable()
export class LogEntryImpl implements LogEntry {

    private _data: LogEntryData;

    public constructor(apiName: string) {

        this._data = new LogEntryData();
        this._data.apiName = apiName;
        this._data.hostName = os.hostname();
    }

    /*
     * Start logging
     */
    public start(event: any, context: Context): void {

        this._data.performance.start();

        // Our callers can supply a custom header so that we can keep track of who is calling each API
        const callingApplicationName = this._getHeader(event, 'x-mycompany-api-client');
        if (callingApplicationName) {
            this._data.callingApplicationName = callingApplicationName;
        }

        // Use the correlation id from request headers or create one
        const correlationId = this._getHeader(event, 'x-mycompany-correlation-id');
        if (correlationId) {
            this._data.correlationId = correlationId;
        } else {
            this._data.correlationId = Guid.create().toString();
        }

        // Log an optional session id if supplied
        const sessionId = this._getHeader(event, 'x-mycompany-session-id');
        if (sessionId) {
            this._data.sessionId = sessionId;
        }
    }

    /*
     * Add identity details for secured requests
     */
    public setIdentity(claims: CoreApiClaims): void {
        this._data.clientId = claims.clientId;
        this._data.userId = claims.userId;
        this._data.userName = `${claims.givenName} ${claims.familyName}`;
    }

    /*
     * An internal method for setting the api name
     */
    public setApiName(name: string): void {
        this._data.apiName = name;
    }

    /*
     * An internal method for setting the operation name
     */
    public setOperationName(name: string): void {
        this._data.operationName = name;
    }

    /*
     * Create a child performance breakdown when requested
     */
    public createPerformanceBreakdown(name: string): PerformanceBreakdown {
        const child = this._data.performance.createChild(name);
        child.start();
        return child;
    }

    /*
     * Add error details after they have been processed by the exception handler, including denormalised fields
     */
    public setApiError(error: ApiError): void {
        this._data.errorData = error.toLogFormat(this._data.apiName);
        this._data.errorCode = error.code;
        this._data.errorId = error.instanceId;
    }

    /*
     * Add error details after they have been processed by the exception handler, including denormalised fields
     */
    public setClientError(error: ClientError): void {
        this._data.errorData = error.toLogFormat();
        this._data.errorCode = error.getErrorCode();
    }

    /*
     * Enable free text to be added to production logs, though this should be avoided in most cases
     */
    public addInfo(info: any): void {
        this._data.infoData.push(info);
    }

    /*
     * Output data
     */
    public end(event: any, context: Context) {

        // Finish performance measurements
        this._data.performance.dispose();

        // Record response details
        // this._data.statusCode = response.statusCode;

        // Finalise this log entry
        this._data.finalise();
    }

    /*
     * Output the log data which will be written to CloudWatch in AWS
     */
    public write(): void {
        console.log(JSON.stringify(this._data.toLogFormat(), null, 2));
    }

    /*
     * Get a header value if supplied
     */
    private _getHeader(event: any, key: string): string | null {

        if (event.headers) {
            const value = event.headers[key];
            if (value) {
                return value;
            }
        }

        return null;
    }
}
