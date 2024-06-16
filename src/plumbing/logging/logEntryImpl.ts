import {APIGatewayProxyEvent, Context} from 'aws-lambda';
import fs from 'fs-extra';
import {Guid} from 'guid-typescript';
import {injectable} from 'inversify';
import os from 'os';
import {ClientError} from '../errors/clientError.js';
import {ServerError} from '../errors/serverError.js';
import {LogEntry} from './logEntry.js';
import {LogEntryData} from './logEntryData.js';
import {PerformanceBreakdown} from './performanceBreakdown.js';

/*
 * A class to manage logging of a lambda request
 */
@injectable()
export class LogEntryImpl implements LogEntry {

    private readonly _data: LogEntryData;
    private readonly _performanceThresholdMilliseconds: number;
    private readonly _prettyPrint: boolean;

    public constructor(apiName: string, prettyPrint: boolean, performanceThresholdMilliseconds: number) {

        this._data = new LogEntryData();
        this._data.hostName = os.hostname();

        this._data.apiName = apiName;
        this._prettyPrint = prettyPrint;
        this._performanceThresholdMilliseconds = performanceThresholdMilliseconds;
    }

    /*
     * Start logging and read data from the context where possible
     */
    public start(event: APIGatewayProxyEvent, context: Context): void {

        this._data.performance.start();

        // Get the operation name and set the performance threshold
        this._calculateOperationName(context);
        this._data.performanceThresholdMilliseconds = this._performanceThresholdMilliseconds;

        // Record REST path details
        this._calculateRequestLocationFields(event);

        // Our callers can supply a custom header so that we can keep track of who is calling each API
        const clientApplicationName = this._getHeader(event, 'x-authsamples-api-client');
        if (clientApplicationName) {
            this._data.clientApplicationName = clientApplicationName;
        }

        // Log an optional session id if supplied
        const sessionId = this._getHeader(event, 'x-authsamples-session-id');
        if (sessionId) {
            this._data.sessionId = sessionId;
        }

        // Calculate the correlation id
        this._calculateCorrelationId(event);
    }

    /*
     * Add identity details for secured requests
     */
    public setIdentity(subject: string): void {
        this._data.userId = subject;
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
     * Ensure that the logged error code is the underlying cause, rather than a generic error returned to the client
     */
    public setErrorCodeOverride(code: string): void {
        this._data.errorCode = code;
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

        if (this._prettyPrint) {

            // On a developer PC, output from 'npm run lambda' is written with pretty printing to a file
            const data = JSON.stringify(this._data.toLogFormat(), null, 2);
            fs.appendFileSync('./test/lambdatest.log', data);

        } else {

            // In AWS Cloudwatch we use bare JSON logging that will work best with log shippers
            // Note that the format remains readable in the Cloudwatch console
            process.stdout.write(JSON.stringify(this._data.toLogFormat()) + '\n');
        }
    }

    /*
     * Calculate the operation name from the AWS function name
     * This is a value such as 'serverlessapi-dev-getCompanyTransactions'
     */
    private _calculateOperationName(context: Context) {

        if (context && context.functionName) {

            // Normal lambdas have a function name
            const parts = context.functionName.split('-');
            if (parts.length > 0) {
                const operationName =  parts[parts.length - 1];
                if (operationName) {
                    this._data.operationName = operationName.trim();
                }
            }
        }
    }

    /*
     * Log details from the incoming URL and query string
     */
    private _calculateRequestLocationFields(event: APIGatewayProxyEvent) {

        if (event) {

            // Log the HTTP method
            if (event.httpMethod) {
                this._data.method = event.httpMethod;
            }

            // Log the full request path including query parameters
            if (event.path) {
                this._data.path = event.path;
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
                        this._data.path += `?${items.join('&')}`;
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
    private _calculateCorrelationId(event: APIGatewayProxyEvent) {

        // See if there is an incoming valid
        const correlationId = this._getHeader(event, 'x-authsamples-correlation-id');

        // Use the client supplied value or generate a new value
        this._data.correlationId = correlationId ? correlationId : Guid.create().toString();
    }

    /*
     * Get a header value if supplied
     */
    private _getHeader(event: APIGatewayProxyEvent, key: string): string | null {

        if (event.headers) {
            const value = event.headers[key];
            if (value) {
                return value;
            }
        }

        return null;
    }
}
