import {Disposable} from '../utilities/disposable';

/*
 * A helper function similar to the .Net concept
 */
export async function using<T extends Disposable>(resource: T, func: () => any): Promise<any> {

    try {
        // Execute a block of code
        return await func();

    } finally {

        // Dispose resources when needed
        resource.dispose();
    }
}
