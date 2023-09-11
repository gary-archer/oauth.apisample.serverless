import fs from 'fs-extra';
import {injectable} from 'inversify';
import {ErrorFactory} from '../../plumbing/errors/errorFactory.js';
import {ErrorCodes} from '../errors/errorCodes.js';

/*
 * A simple utility to deal with the infrastructure of reading JSON files
 */
@injectable()
export class JsonFileReader {

    /*
     * Do the file reading and return a promise
     */
    public async readData<T>(filePath: string): Promise<T> {

        try {

            // Try the file operation
            const buffer = await fs.readFile(filePath);
            return JSON.parse(buffer.toString()) as T;

        } catch (e: any) {

            // Report the error including an error code and exception details
            const error = ErrorFactory.createServerError(
                ErrorCodes.fileReadError,
                'Problem encountered reading data',
                e.stack);

            // File system errors are a JSON object with the error number
            if (e instanceof Error) {
                error.setDetails(e.message);
            } else {
                error.setDetails(e);
            }

            throw error;
        }
    }
}
