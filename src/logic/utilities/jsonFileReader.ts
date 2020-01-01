import fs from 'fs-extra';
import {injectable} from 'inversify';
import {CustomException} from '../errors/customException';

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

        } catch (e) {

            // Report the error including an error code and exception details
            const error = new CustomException('file_read_error', 'Problem encountered reading data');
            error.details = e;
            throw error;
        }
    }
}
