import {LoggerFactory} from './loggerFactory.js';
import {LoggerFactoryImpl} from './loggerFactoryImpl.js';

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
