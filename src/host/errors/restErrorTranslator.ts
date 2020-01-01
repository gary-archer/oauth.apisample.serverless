import {ApiError, ApplicationExceptionHandler, DefaultClientError} from '../../framework-api-base';
import {BusinessError} from '../../logic/errors/businessError';
import {CustomException} from '../../logic/errors/customException';

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
            return new DefaultClientError(
                    this._getStatusCode(businessError),
                    businessError.code,
                    businessError.message);
        }

        // Catch errors that will be returned with a 500 status
        if (ex instanceof CustomException) {
            const customException = ex as CustomException;

            // Return a REST specific error
            const apiError = new ApiError(
                    customException.code,
                    customException.message,
                    customException.stack);

            if (customException.details) {
                apiError.details = customException.details;
            }

            return apiError;
        }

        return ex;
    }

    /*
     * Calculate the status code based on the type of business error
     */
    private _getStatusCode(error: BusinessError): number {

        switch (error.code) {

            // Use 404 for these errors
            case 'company_not_found':
                return 404;

            // Return 400 by default
            default:
                return 400;
        }
    }
}
