import {Context} from 'aws-lambda';
import {Guid} from 'guid-typescript';
import {injectable} from 'inversify';
import os from 'os';
import {CoreApiClaims} from '../claims/coreApiClaims';
import {ClientError} from '../errors/clientError';
import {ServerError} from '../errors/ServerError';
import {LogEntry} from './logEntry';
import {LogEntryData} from './logEntryData';
import {PerformanceBreakdown} from './performanceBreakdown';

/*
 * A class to manage logging of a lambda request
 */
@injectable()
export class LogEntryImpl implements LogEntry {

    private readonly _data: LogEntryData;
    private readonly _getPerformanceThreshold: ((op: string) => number) | null;

    public constructor(apiName: string, getPerformanceThreshold: ((op: string) => number) | null) {

        this._data = new LogEntryData();
        this._data.apiName = apiName;
        this._data.hostName = os.hostname();
        this._getPerformanceThreshold = getPerformanceThreshold;
    }

    /*
     * Start logging and read data from the context where possible
     */
    public start(event: any, context: Context): void {

        this._data.performance.start();

        // Get the operation name and its performance threshold
        this._calculateOperationName(event, context);
        this._data.performanceThresholdMilliseconds = this._getPerformanceThreshold!(this._data.operationName);

        // Record REST path details
        this._calculateRequestLocationFields(event);

        // Our callers can supply a custom header so that we can keep track of who is calling each API
        const clientApplicationName = this._getHeader(event, 'x-mycompany-api-client');
        if (clientApplicationName) {
            this._data.clientApplicationName = clientApplicationName;
        }

        // Log an optional session id if supplied
        const sessionId = this._getHeader(event, 'x-mycompany-session-id');
        if (sessionId) {
            this._data.sessionId = sessionId;
        }

        // Calculate the correlation id
        this._calculateCorrelationId(event);
    }

    /*
     * Add identity details for secured requests
     */
    public setIdentity(claims: CoreApiClaims): void {
        this._data.clientOAuthId = claims.clientId;
        this._data.userId = claims.userDatabaseId;
        this._data.userOAuthId = claims.subject;
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
    public setServerError(error: ServerError): void {
        this._data.errorData = error.toLogFormat(this._data.apiName);
        this._data.errorCode = error.getErrorCode();
        this._data.errorId = error.getInstanceId();
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
    public end(): void {
        this._data.performance.dispose();
        this._data.finalise();
    }

    /*
     * Output the log data as JSON
     */
    public write(): void {

        if (process.env.IS_LOCAL) {

            // On a developer PC, output logs with pretty printing
            console.log(JSON.stringify(this._data.toLogFormat(), null, 2));

        } else {

            // In AWS Cloudwatch we use bare JSON logging that will work best with log shippers
            // Note that the format remains readable in the Cloudwatch console
            process.stdout.write(JSON.stringify(this._data.toLogFormat()) + '\n');
        }
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
    private _calculateCorrelationId(event: any) {

        // See if there is an incoming valid
        const correlationId = this._getHeader(event, 'x-mycompany-correlation-id');

        // Use the client supplied value or generate a new value
        this._data.correlationId = correlationId ? correlationId : Guid.create().toString();
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
