import * as TunnelAgent from 'tunnel-agent';
import * as Url from 'url';

/*
 * Some HTTP libraries require an agent to be expressed in order to see traffic in Fiddler or Charles
 * This  class to manage the proxy agent used for HTTP debugging
 */
export class DebugProxyAgent {

    /*
     * Create the agent if there is a proxy environment variable
     */
    public static async initialize(): Promise<void> {

        if (process.env.HTTPS_PROXY) {

            // Use a dynamic import so that this dependency is only used on a developer PC
            await import('tunnel-agent');
        
            const opts = Url.parse(process.env.HTTPS_PROXY as string);
            DebugProxyAgent.proxyAgent = TunnelAgent.httpsOverHttp({
                proxy: opts,
            });
        }
    }

    /*
     * Return the configured agent
     */
    public static get(): any {
        return DebugProxyAgent.proxyAgent;
    }

    /*
     * Return true if debugging
     */
    public static isDebuggingActive(): any {
        return DebugProxyAgent.proxyAgent !== null;
    }

    /*
     * The agent instance that will be supplied to HTTP libraries
     */
    private static proxyAgent: any = null;
}
