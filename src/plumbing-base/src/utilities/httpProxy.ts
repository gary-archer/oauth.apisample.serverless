import Url from 'url';

/*
 * Manage supplying the HTTP proxy on outgoing calls from lambdas or the authorizer
 */
export class HttpProxy {

    /*
     * Configure the proxy agent used for HTTP debugging
     */
    public static async initialize(useProxy: boolean, proxyUrl: string): Promise<void> {

        if (useProxy) {

            // Ensure that the standard environment variable is set for our process
            process.env.HTTPS_PROXY = proxyUrl;

            // Use a dynamic import so that this dependency is only used on a developer PC
            await import('tunnel-agent').then((agent) => {
                const opts = Url.parse(proxyUrl);
                HttpProxy._agent = agent.httpsOverHttp({proxy: opts});
            });
        }
    }

    /*
     * Configure Open Id Client HTTP options, including the proxy
     */
    public static getOptions(options: any): any {

        options.agent = {
            https: HttpProxy._agent,
        };

        return options;
    }

    // The global agent instance
    private static _agent: any = null;
}
