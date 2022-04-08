import {spawn} from 'child_process';

/*
 * An async wrapper around spawn, asapted slightly from here
 * https://github.com/ralphtheninja/await-spawn
 */
export class ChildProcess {

    public static async run(command: string, args: string[]): Promise<string> {

        return new Promise((resolve, reject) => {

            let result = '';
            const child = spawn(command, args);

            child.stdout.on('data', data => {
                result += data;
            });

            child.stderr.on('data', data => {
                result += data;
            });

            child.on('close', code => {

                if (code === 0) {
                    resolve(result);
                } else {
                    reject(`Child process failed with exit code ${code}: ${result}`);
                }
            });

            child.on('error', e => {
                reject(`Child process failed: ${e.message}: ${result}`);
            });
        });
    }
}
