import middy from '@middy/core';
import {HttpProxy} from '../utilities/httpProxy';

/*
 * A middleware to handle capturing outgoing messages in an HTTP proxy on a developer PC
 */
export class HttpProxyMiddleware implements middy.MiddlewareObject<any, any> {

    private readonly _useProxy: boolean;
    private readonly _proxyUrl: string;

    public constructor(useProxy: boolean, proxyUrl: string) {
        this._useProxy = useProxy;
        this._proxyUrl = proxyUrl;
        this._setupCallbacks();
    }

    /*
     * Run the middleware
     */
    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async before(handler: middy.HandlerLambda, next: middy.NextFunction): Promise<void> {

        // Call the utility class
        await HttpProxy.initialize(this._useProxy, this._proxyUrl);

        // Do not call next when the handler returns a promise, since middy calls it for us
    }

    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
