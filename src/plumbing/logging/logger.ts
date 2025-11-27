import fs from 'node:fs/promises';

/*
 * A simple logger class without adding frameworks that increase lambda upload sizes
 */
export class Logger {

    private readonly type: string;
    private readonly prettyPrint: boolean;

    public constructor(type: string, prettyPrint: boolean) {
        this.type = type;
        this.prettyPrint = prettyPrint;
    }

    public write(data: any): void {

        if (this.prettyPrint) {

            // On a developer PC, output from 'npm run lambda' is written with pretty printing to a file
            fs.appendFile(`./api-${this.type}.log`, JSON.stringify(data, null, 2));

        } else {

            // In AWS Cloudwatch we use bare JSON logging that will work best with log shippers
            // Note that the format remains readable in the Cloudwatch console
            process.stdout.write(JSON.stringify(data) + '\n');
        }
    }
}
