/*
 * Manage routing outbound calls from the API via an HTTP proxy
 */
export class HttpProxy {

    private readonly useProxy: boolean;
    private readonly proxyUrl: string;
    private agent: any;

    /*
     * Create an HTTP agent to route requests to
     */
    public constructor(useProxy: boolean, proxyUrl: string) {

        this.useProxy = useProxy;
        this.proxyUrl = proxyUrl;
        this.agent = null;
    }

    /*
     * The proxy module is only used for development, so avoid adding to the AWS upload size
     */
    public async initialize(): Promise<void> {

        if (this.useProxy) {

            const module = await import('http-proxy-agent');
            this.agent = new module.HttpProxyAgent(this.proxyUrl);
        }
    }

    /*
     * Return the agent to other parts of the app
     */
    public getAgent(): any {
        return this.agent;
    }
}
