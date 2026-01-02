import middy from '@middy/core';
import {APIGatewayProxyResult} from 'aws-lambda';
import {Container} from 'inversify';
import {APIGatewayProxyExtendedEvent} from '../utilities/apiGatewayExtendedProxyEvent';

/*
 * Creates a child container for each request, to contain request-scoped objects
 */
export class ChildContainerMiddleware implements
    middy.MiddlewareObj<APIGatewayProxyExtendedEvent, APIGatewayProxyResult> {

    private readonly parentContainer: Container;

    public constructor(parentContainer: Container) {
        this.parentContainer = parentContainer;
        this.setupCallbacks();
    }

    /*
     * Create the container when a request begins
     */
    public before(request: middy.Request<APIGatewayProxyExtendedEvent, APIGatewayProxyResult>): void {
        request.event.container = new Container({ parent: this.parentContainer });
    }

    /*
     * Delete the container when a request ends
     */
    public after(request: middy.Request<APIGatewayProxyExtendedEvent, APIGatewayProxyResult>): void {
        delete (request.event as any).container;
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private setupCallbacks(): void {
        this.before = this.before.bind(this);
        this.after = this.after.bind(this);
    }
}
