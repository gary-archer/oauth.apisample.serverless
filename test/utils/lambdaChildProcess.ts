import {spawn} from 'child_process';
import fs from 'fs-extra';
import {LambdaChildProcessOptions} from './lambdaChildProcessOptions';

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
            path: '/api/userinfo',
            headers: {
                authorization: `Bearer ${options.accessToken}`,
                'x-mycompany-api-client': 'ServerlessTest',
                'x-mycompany-session-id': options.sessionId,
            },
        };
        fs.writeFile('test/input.txt', JSON.stringify(lambdaInput, null, 2));

        // Run the Serverless API operation as a file to file operation
        await LambdaChildProcess._runChildProcess(
            'sls',
            ['invoke', 'local', '-f', options.lambdaFunction, '-p', 'test/input.txt']);

        // Read the response file up to the '}' line, since Serverless sometimes adds other messages after this
        const rawResponse = await fs.readFile('test/output.txt', 'utf8');

        // Return the raw lambda output as an object based response
        const responseData = JSON.parse(rawResponse);
        const body = JSON.parse(responseData.body);
        return {
            statusCode: responseData.statusCode,
            body,
        };
    }

    /*
     * Do the child process work
     * https://github.com/ralphtheninja/await-spawn
     */
    private static async _runChildProcess(command: string, args: string[]): Promise<void> {

        return new Promise((resolve, reject) => {

            let result = '';
            const child = spawn(command, args);

            child.stdout.on('data', data => {
                result += data;
            });

            child.stderr.on('data', data => {
                result += data;
            });

            child.on('close', async code => {

                if (code === 0) {

                    await fs.writeFile('test/output.txt', result);
                    resolve();

                } else {

                    await fs.writeFile('test/output.txt', result);
                    reject(`Child process failed with exit code ${code}`);
                }
            });

            child.on('error', async e => {

                await fs.writeFile('test/output.txt', result);
                reject(`Child process failed: ${e.message}`);

            });
        });
    }
}
