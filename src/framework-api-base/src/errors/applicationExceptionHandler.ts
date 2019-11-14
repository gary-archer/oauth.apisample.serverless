/*
 * An interface to allow the application to translate some types of exception
 */
export interface ApplicationExceptionHandler {
    translate(ex: any): any;
}
