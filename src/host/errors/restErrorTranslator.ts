import {ApplicationExceptionHandler, ErrorFactory} from '../../framework-api-base';
import {BusinessError} from '../../logic/errors/businessError';
import { ErrorCodes } from '../../logic/errors/errorCodes';

/*
 * A class to perform application level error translation
 */
export class RestErrorTranslator implements ApplicationExceptionHandler {

    /*
     * The host manages translation from business logic errors to REST errors
     */
    public translate(ex: any): any {

        // Catch errors that will be returned with a 4xx status
        if (ex instanceof BusinessError) {
            const businessError = ex as BusinessError;

            // Return a REST specific error
            return ErrorFactory.createClientError(
                    this._getStatusCode(businessError),
                    businessError.code,
                    businessError.message);
        }

        return ex;
    }

    /*
     * Calculate the status code based on the type of business error
     */
    private _getStatusCode(error: BusinessError): number {

        switch (error.code) {

            // Use 404 for these errors
            case ErrorCodes.companyNotFound:
                return 404;

            // Return 400 by default
            default:
                return 400;
        }
    }
}
