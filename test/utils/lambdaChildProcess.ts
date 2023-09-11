import {spawn} from 'child_process';
import fs from 'fs-extra';
import {LambdaChildProcessOptions} from './lambdaChildProcessOptions.js';

/*
 * Encapsulate running a lambda as a child process, with input and output
 */
export class LambdaChildProcess {

    /*
     * Run a lambda in a file to file manner with some parameters
     */
    public static async invoke(options: LambdaChildProcessOptions): Promise<any> {

        // Create the lambda function's request, including the access token and some custom headers for API logging
        const lambdaInput = {
            httpMethod: 'GET',
            path: options.apiPath,
            headers: {
                authorization: `Bearer ${options.accessToken}`,
                'x-mycompany-api-client': 'ServerlessTest',
                'x-mycompany-session-id': options.sessionId,
            },
        } as any;

        // Add path parameters if required
        if (options.pathParameters) {
            lambdaInput.pathParameters = options.pathParameters;
        }

        // This custom header allows us to rehearse API 500 exceptions in tests
        if (options.rehearseException) {
            lambdaInput.headers['x-mycompany-test-exception'] = 'SampleApi';
        }

        fs.writeFile('test/input.txt', JSON.stringify(lambdaInput, null, 2));

        // Run the Serverless API operation and return its output
        await LambdaChildProcess._runChildProcess(
            LambdaChildProcess.getServerlessCommand(),
            ['invoke', 'local', '-f', options.lambdaFunction, '-p', 'test/input.txt']);
        return await LambdaChildProcess._transformOutput();
    }

    /*
     * Do the child process work
     * https://github.com/ralphtheninja/await-spawn
     */
    private static async _runChildProcess(command: string, args: string[]): Promise<void> {

        return new Promise((resolve, reject) => {

            let childProcessOutput = '';
            const child = spawn(command, args);

            child.stdout.on('data', data => {
                childProcessOutput += data;
            });

            child.stderr.on('data', data => {
                childProcessOutput += data;
            });

            child.on('close', async code => {

                if (code === 0) {

                    await fs.writeFile('test/output.txt', childProcessOutput);
                    resolve();

                } else {

                    await fs.writeFile('test/output.txt', childProcessOutput);
                    reject(`Child process failed with exit code ${code}: ${childProcessOutput}`);
                }
            });

            child.on('error', async e => {

                if (e && e.message) {
                    childProcessOutput += `, Error: ${e.message}`;
                }

                await fs.writeFile('test/output.txt', childProcessOutput);
                reject(`Child process failed: ${childProcessOutput}`);
            });
        });
    }

    /*
     * Reliably transform the child process output into a response object
     */
    private static async _transformOutput(): Promise<any> {

        const lambdaOutput = await fs.readFile('test/output.txt', 'utf8');

        // Read the response file up to the '}' line, since Serverless sometimes adds other messages after this
        let responseJson = '';
        lambdaOutput.split(/\r?\n/).every(line =>  {
            responseJson += line + '\n';
            return line === '}' ? false : true;
        });

        // Return an object based response, which requires double deserialization to get the body
        const responseData = JSON.parse(responseJson);
        const body = JSON.parse(responseData.body);
        return {
            statusCode: responseData.statusCode,
            body,
        };
    }

    /*
     * On Windows we must create a child process via the .cmd executable
     */
    private static getServerlessCommand(): string {

        const commandName = (process.platform === 'win32') ? 'sls.cmd' : 'sls';
        const dirname = process.cwd();
        return `${dirname}/node_modules/.bin/${commandName}`;
    }
}
