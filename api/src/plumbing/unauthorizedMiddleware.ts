import middy from 'middy';

/*
 * This middleware is called after the claims middleware and exists solely to work around middy problems
 */
class UnauthorizedMiddleware {

    /*
     * Our API controller should only be called when the (async) claims middleware calls next
     * However, middy calls it anyway, so we work around this via this (non async) middleware
     */
    public onBefore(handler: middy.IHandlerLambda<any, object>, next: middy.IMiddyNextFunction): any {

        // Only move onto the API controller if we are authorized
        if (!!handler.event.claims) {
            next();
        }
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
        this.onBefore = this.onBefore.bind(this);
    }
}

/*
 * Do the export plumbing
 */
export function unauthorizedMiddleware() {

    const middleware = new UnauthorizedMiddleware();
    return {
        before: middleware.onBefore,
    };
}
