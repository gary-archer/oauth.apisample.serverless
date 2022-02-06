import {LoggerFactory} from './loggerFactory';
import {LoggerFactoryImpl} from './loggerFactoryImpl';

/*
 * A simple builder class
 */
export class LoggerFactoryBuilder {

    /*
     * Return the logger factory via its interface
     */
    public static create(): LoggerFactory {
        return new LoggerFactoryImpl();
    }
}
