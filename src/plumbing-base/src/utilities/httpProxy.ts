import url from 'url';

/*
 * Manage supplying the HTTP proxy on outgoing calls from lambdas or the authorizer
 */
export class HttpProxy {

    private _useProxy: boolean;
    private _proxyUrl: string;
    private _agent: any = null;

    public constructor() {
        this._useProxy = false;
        this._proxyUrl = '';
        this._agent = null;
        this._setupCallbacks();
    }

    /*
     * Configure the proxy agent used for HTTP debugging
     */
    public async initialize(useProxy: boolean, proxyUrl: string): Promise<void> {

        this._useProxy = useProxy;
        if (this._useProxy) {

            // Also ensure that the standard environment variable is set for our process
            this._proxyUrl = proxyUrl;
            process.env.HTTPS_PROXY = this._proxyUrl;

            // Use a dynamic import so that this dependency is only used on a developer PC
            await import('tunnel-agent').then((agent) => {

                const opts = url.parse(this._proxyUrl);
                this._agent = agent.httpsOverHttp({
                    proxy: opts,
                });
            });
        }
    }

    /*
     * Set HTTP options as required by the Open ID Client library
     */
    public setOptions(options: any): any {

        options.agent = {
            https: this._agent,
        };

        return options;
    }

    /*
     * Return the URL when needed
     */
    public getUrl(): string {
        return this._proxyUrl;
    }

    /*
     * Plumbing to ensure the this parameter is available
     */
    private _setupCallbacks(): void {
        this.setOptions = this.setOptions.bind(this);
    }
}
