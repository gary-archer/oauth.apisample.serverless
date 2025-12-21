import {Context} from 'aws-lambda';
import {randomUUID} from 'crypto';
import {injectable} from 'inversify';
import os from 'os';
import {ClientError} from '../errors/clientError.js';
import {ServerError} from '../errors/serverError.js';
import {APIGatewayProxyExtendedEvent} from '../utilities/apiGatewayExtendedProxyEvent.js';
import {TextValidator} from '../utilities/textValidator.js';
import {IdentityLogData} from './identityLogData.js';
import {LogEntry} from './logEntry.js';
import {LogEntryData} from './logEntryData.js';
import {PerformanceBreakdown} from './performanceBreakdown.js';

/*
 * A log entry collects data during an API request and outputs it at the end
 */
@injectable()
export class LogEntryImpl implements LogEntry {

    private readonly data: LogEntryData;
    private readonly performanceThresholdMilliseconds: number;

    public constructor(apiName: string, performanceThresholdMilliseconds: number) {

        this.data = new LogEntryData();
        this.data.hostName = os.hostname();
        this.data.apiName = apiName;
        this.performanceThresholdMilliseconds = performanceThresholdMilliseconds;
    }

    /*
     * Start logging and read data from the context where possible
     */
    public start(event: APIGatewayProxyExtendedEvent, context: Context): void {

        this.data.performance.start();

        // Set the correlation id
        let correlationId = this.getHeader(event, 'correlation-id');
        if (correlationId) {
            correlationId = TextValidator.sanitize(correlationId);
        }
        this.data.correlationId = correlationId ? correlationId : randomUUID();

        // Get the operation name and set the performance threshold
        this.calculateOperationName(context);
        this.data.performanceThresholdMilliseconds = this.performanceThresholdMilliseconds;

        // Record REST path details
        this.calculateRequestLocationFields(event);
    }

    /*
     * Audit identity details
     */
    public setIdentity(data: IdentityLogData): void {
        this.data.userId = data.userId;
        this.data.clientId = data.clientId;
        this.data.sessionId = data.sessionId;
        this.data.scope = data.scope;
        this.data.claims = data.claims;
    }

    /*
     * An internal method for setting the operation name
     */
    public setOperationName(name: string): void {
        this.data.operationName = name;
    }

    /*
     * Create a child performance breakdown when requested
     */
    public createPerformanceBreakdown(name: string): PerformanceBreakdown {
        const child = this.data.performance.createChild(name);
        child.start();
        return child;
    }

    /*
     * Add error details after they have been processed by the exception handler, including denormalised fields
     */
    public setServerError(error: ServerError): void {
        this.data.errorData = error.toLogFormat(this.data.apiName);
        this.data.errorCode = error.getErrorCode();
        this.data.errorId = error.getInstanceId();
    }

    /*
     * Add error details after they have been processed by the exception handler, including denormalised fields
     */
    public setClientError(error: ClientError): void {
        this.data.errorData = error.toLogFormat();
        this.data.errorCode = error.getErrorCode();
    }

    /*
     * Ensure that the logged error code is the underlying cause, rather than a generic error returned to the client
     */
    public setErrorCodeOverride(code: string): void {
        this.data.errorCode = code;
    }

    /*
     * Enable free text to be added to production logs, though this should be avoided in most cases
     */
    public addInfo(info: any): void {
        this.data.infoData.push(info);
    }

    /*
     * Called by the OAuth authorizer
     */
    public setResponseStatus(status: number): void {
        this.data.statusCode = status;
    }

    /*
     * Finish writing output data by adding response details
     */
    public end(): void {
        this.data.performance[Symbol.dispose]();
        this.data.finalise();
    }

    /*
     * Get the request data to output to logs for a support team
     */
    public getRequestLog(): any {
        return this.data.toRequestLog();
    }

    /*
     * Get the audit data to output to logs for a security team
     */
    public getAuditLog(): any {
        return this.data.toAuditLog();
    }

    /*
     * Calculate the operation name from the AWS function name
     * This is a value such as 'serverlessapi-dev-getCompanyTransactions'
     */
    private calculateOperationName(context: Context) {

        if (context && context.functionName) {

            // Normal lambdas have a function name
            const parts = context.functionName.split('-');
            if (parts.length > 0) {
                const operationName =  parts[parts.length - 1];
                if (operationName) {
                    this.data.operationName = operationName.trim();
                }
            }
        }
    }

    /*
     * Log details from the incoming URL and query string
     */
    private calculateRequestLocationFields(event: APIGatewayProxyExtendedEvent) {

        if (event) {

            // Log the HTTP method
            if (event.httpMethod) {
                this.data.method = event.httpMethod;
            }

            // Log the full request path including query parameters
            if (event.path) {
                this.data.path = event.path;
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
                        this.data.path += `?${items.join('&')}`;
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
                    this.data.resourceId = items.join('/');
                }
            }
        }
    }

    /*
     * Correlate requests together
     */
    private calculateCorrelationId(event: APIGatewayProxyExtendedEvent) {

        let correlationId = this.getHeader(event, 'correlation-id');
        if (correlationId) {
            correlationId = TextValidator.sanitize(correlationId);
        }

        this.data.correlationId = correlationId ? correlationId : randomUUID();
    }

    /*
     * Get a header value if supplied
     */
    private getHeader(event: APIGatewayProxyExtendedEvent, key: string): string | null {

        if (event.headers) {

            const found = Object.keys(event.headers).find((h) => h.toLowerCase() === key);
            if (found) {
                return event.headers[found] as string;
            }
        }

        return null;
    }
}
