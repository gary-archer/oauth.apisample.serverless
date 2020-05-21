import Url from 'url';

/*
 * Some HTTP libraries require an agent to be expressed in order to see traffic in Fiddler or Charles
 */
export class DebugProxyAgent {

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
                DebugProxyAgent._agent = agent.httpsOverHttp({proxy: opts});
            });
        }
    }

    /*
     * Return the configured agent
     */
    public static get(): any {
        return DebugProxyAgent._agent;
    }

    /*
     * Return true if debugging
     */
    public static isDebuggingActive(): any {
        return DebugProxyAgent._agent !== null;
    }

    // The global agent instance
    private static _agent: any = null;
}
