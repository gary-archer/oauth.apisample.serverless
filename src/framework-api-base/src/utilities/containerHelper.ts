import {Container} from 'inversify';

/*
 * A utility class to return the child container for the current request
 */
export class ContainerHelper {

    public static current(event: any): Container {
        return event.container as Container;
    }
}
