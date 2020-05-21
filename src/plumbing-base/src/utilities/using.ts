import {Disposable} from '../utilities/disposable';

/*
 * A helper function similar to the .Net concept
 */
export async function using<T extends Disposable>(resource: T, func: () => any) {
    try {
        return await func();
    } finally {
        resource.dispose();
    }
}
