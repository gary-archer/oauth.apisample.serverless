import {Context} from 'aws-lambda';
import {Guid} from 'guid-typescript';
import {injectable} from 'inversify';
import os from 'os';
import {LogEntry, PerformanceBreakdown} from '../../../framework-base';
import {ApiError} from '../errors/apiError';
import {ClientError} from '../errors/clientError';
import {ServerlessOfflineUnauthorizedError} from '../errors/serverlessOfflineUnauthorizedError';
import {CoreApiClaims} from '../security/coreApiClaims';
import {LogEntryData} from './logEntryData';
import {PerformanceThreshold} from './performanceThreshold';

/*
 * A class to manage logging of a lambda request
 */
@injectable()
export class LogEntryImpl implements LogEntry {

    private _data: LogEntryData;
    private _defaultThresholdMilliseconds!: number;
    private _performanceThresholdOverrides!: PerformanceThreshold[];

    public constructor(apiName: string) {

        this._data = new LogEntryData();
        this._data.apiName = apiName;
        this._data.hostName = os.hostname();
    }

    /*
     * Set default performance details after creation
     */
    public setPerformanceThresholds(defaultMilliseconds: number, overrides: PerformanceThreshold[]) {
        this._defaultThresholdMilliseconds = defaultMilliseconds;
        this._data.performanceThresholdMilliseconds = this._defaultThresholdMilliseconds;
        this._performanceThresholdOverrides = overrides;
    }

    /*
     * Start logging and read data from the context where possible
     */
    public start(event: any, context: Context): void {

        this._data.performance.start();

        // Get the operation name and its performance threshold
        this._calculateOperationName(event, context);
        this._data.performanceThresholdMilliseconds = this._getPerformanceThreshold(this._data.operationName);

        // Record REST path details
        this._calculateRequestLocationFields(event);

        // Our callers can supply a custom header so that we can keep track of who is calling each API
        const callingApplicationName = this._getHeader(event, 'x-mycompany-api-client');
        if (callingApplicationName) {
            this._data.callingApplicationName = callingApplicationName;
        }

        // Log an optional session id if supplied
        const sessionId = this._getHeader(event, 'x-mycompany-session-id');
        if (sessionId) {
            this._data.sessionId = sessionId;
        }

        // Calculate the correlation id
        this._calculateCorrelationId(event, context);
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
     * Called by the OAuth authorizer
     */
    public setResponseStatus(status: number): void {
        this._data.statusCode = status;
    }

    /*
     * Finish writing output data by adding response details
     */
    public end(response: any) {
        this._data.performance.dispose();
        this._calculateResponseStatus(response);
        this._data.finalise();
    }

    /*
     * Output the log data which will be written to CloudWatch in AWS
     */
    public write(event: any): void {
        console.log(JSON.stringify(this._data.toLogFormat(), null, 2));

        // Special handling for Serverless offline after log entry completion
        ServerlessOfflineUnauthorizedError.throwIfRequired(event, this._data.statusCode);
    }

    /*
     * Calculate the operation name from the AWS function name
     * This is a value such as 'sampleapi-default-getCompanyList'
     */
    private _calculateOperationName(event: any, context: Context) {

        if (context && context.functionName) {

            // Normal lambdas have a function name
            const parts = context.functionName.split('-');
            if (parts.length > 0) {
               const operationName =  parts[parts.length - 1];
               if (operationName) {
                    this._data.operationName = operationName.trim();
               }
            }
        } else if (event && event.type === 'REQUEST') {

            // Authorizers have an event type of REQUEST
            this._data.operationName = 'authorizer';
        }
    }

    /*
     * Log details from the incoming URL and query string
     */
    private _calculateRequestLocationFields(event: any) {

        if (event) {

            // Log the HTTP method
            if (event.httpMethod) {
                this._data.requestVerb = event.httpMethod;
            }

            // Log the full request path including query parameters
            if (event.path) {
                this._data.requestPath = event.path;
                if (event.queryStringParameters) {

                    // Collect each item
                    const items = [];
                    for (const key in event.queryStringParameters) {
                        if (key) {
                            items.push(`${key}=${event.queryStringParameters[key]}`);
                        }
                    }

                    // Append to the base path
                    if (items.length > 0) {
                        this._data.requestPath += `?${items.join('&')}`;
                    }
                }
            }

            // Log the resource ids, which are the URL path segment runtime parameters
            if (event.pathParameters) {

                // Collect each item
                const items = [];
                for (const key in event.pathParameters) {
                    if (key) {
                        items.push(event.pathParameters[key]);
                    }
                }

                // Record as a hierarchy
                if (items.length > 0) {
                    this._data.resourceId = items.join('/');
                }
            }
        }
    }

    /*
     * Correlate requests together, including authorizers and lambdas
     */
    private _calculateCorrelationId(event: any, context: Context) {

        // See if there is an incoming valid
        const correlationId = this._getHeader(event, 'x-mycompany-correlation-id');
        if (correlationId) {

            // Use the client supplied value
            this._data.correlationId = correlationId;

        } else if (context.awsRequestId) {

            // Use the AWS generated value otherwise
            this._data.correlationId = context.awsRequestId;

        } else {

            // Otherwise generate a value
            this._data.correlationId = Guid.create().toString();
        }
    }

    /*
     * Try to calculate the response status unless it has been set already
     */
    private _calculateResponseStatus(response: any): void {

        if (!this._data.statusCode) {
            if (response && response.statusCode) {
                this._data.statusCode = response.statusCode;
            }
        }
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

    /*
     * Given an operation name, set its performance threshold
     */
    private _getPerformanceThreshold(name: string): number {

        const found = this._performanceThresholdOverrides.find((o) => o.name.toLowerCase() === name.toLowerCase());
        if (found) {
            return found.milliseconds;
        }

        return this._defaultThresholdMilliseconds;
    }
}
