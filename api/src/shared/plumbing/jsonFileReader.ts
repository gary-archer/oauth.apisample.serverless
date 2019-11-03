import * as fs from 'fs-extra';

/*
 * A helper class to read JSON from a physical file into objects
 */
export class JsonFileReader {

    /*
     * Read the supplied file and return JSON objects of the specified type
     */
    public async readFile<T>(filePath: string): Promise<T> {

        const buffer = await fs.readFile(filePath);
        return JSON.parse(buffer.toString()) as T;
    }
}
