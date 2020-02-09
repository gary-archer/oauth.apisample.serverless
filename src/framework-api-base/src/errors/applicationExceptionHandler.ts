/*
 * An interface to allow the application to translate some types of exception
 */
export class ApplicationExceptionHandler {

    public translate(ex: any): any {
        return ex;
    }
}
