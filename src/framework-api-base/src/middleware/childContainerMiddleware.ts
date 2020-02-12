import {Container} from 'inversify';
import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';

/*
 * A middleware to create a child container per request
 */
export class ChildContainerMiddleware implements MiddlewareObject<any, any> {

    private readonly _container: Container;

    public constructor(container: Container) {
        this._container = container;
        this._setupCallbacks();
    }

    /*
     * Create the child container at the start of each request
     */
    public before(handler: HandlerLambda<any, any>, next: NextFunction): void {

        handler.event.container = this._container.createChild();
        next();
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
