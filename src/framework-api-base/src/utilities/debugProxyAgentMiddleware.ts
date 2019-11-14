import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';
import {DebugProxyAgent} from './debugProxyAgent';

/*
 * A middleware to handle HTTP debugging configuration on a developer PC
 */
export class DebugProxyAgentMiddleware implements MiddlewareObject<any, any> {

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
    public async before(handler: HandlerLambda, next: NextFunction): Promise<void> {

        // Call the utility class
        await DebugProxyAgent.initialize(this._useProxy, this._proxyUrl);

        // Do not call next when the handler returns a promise, since middy calls it for us
    }

    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
