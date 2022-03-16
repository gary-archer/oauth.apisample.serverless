/*
 * Manage routing outbound calls from the API via an HTTP proxy
 */
export class HttpProxy {

    private readonly _useProxy: boolean;
    private readonly _proxyUrl: string;
    private _agent: any;

    /*
     * Create an HTTP agent to route requests to
     */
    public constructor(useProxy: boolean, proxyUrl: string) {

        this._useProxy = useProxy;
        this._proxyUrl = proxyUrl;
        this._agent = null;
    }

    /*
     * The proxy module is only used for development, so avoid adding to the AWS upload size
     */
    public async initialize(): Promise<void> {

        if (this._useProxy) {

            const module = await import('proxy-agent');
            this._agent = new module.default(this._proxyUrl);
        }
    }

    /*
     * Return the agent to other parts of the app
     */
    public get agent(): any {
        return this._agent;
    }
}
