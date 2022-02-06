import {ClientError} from '../errors/clientError';
import {ErrorFactory} from '../errors/errorFactory';
import {ErrorUtils} from '../errors/errorUtils';
import {CookieErrorCodes} from './cookieErrorCodes';

/*
 * Cookie related errors are created and logged here
 */
export class CookieErrorUtils {

    /*
     * All standards based browsers should send an origin header
     */
    public static fromMissingOriginError(): ClientError {

        const error = ErrorFactory.createClient401Error(
            'An origin header was not supplied in a request containing secure cookies');

        const logContext = error.getLogContext();
        logContext.code = CookieErrorCodes.missingWebOrigin;

        return error;
    }

    /*
     * Indicate an untrusted web origin
     */
    public static fromUntrustedOriginError(): ClientError {

        const error = ErrorFactory.createClient401Error(
            'An untrusted value was supplied in the origin header, in a request containing secure cookies');

        const logContext = error.getLogContext();
        logContext.code = CookieErrorCodes.untrustedWebOrigin;

        return error;
    }

    /*
     * Indicate a cookie not sent, which could be a browser issue
     */
    public static fromMissingCookieError(name: string): ClientError {

        const error = ErrorFactory.createClient401Error(
            `The ${name} cookie was not received in an incoming request`);

        const logContext = error.getLogContext();
        logContext.code = CookieErrorCodes.cookieNotFoundError;

        return error;
    }

    /*
     * This occurs if the anti forgery token was not provided
     */
    public static fromMissingAntiForgeryTokenError(): ClientError {

        const error = ErrorFactory.createClient401Error(
            'An anti forgery request header was not supplied for a data changing command');

        const logContext = error.getLogContext();
        logContext.code = CookieErrorCodes.missingAntiForgeryTokenError;

        return error;
    }

    /*
     * This occurs if the anti forgery token does not have the expected value
     */
    public static fromMismatchedAntiForgeryTokenError(): ClientError {

        const error = ErrorFactory.createClient401Error(
            'The anti forgery request header value does not match that of the request cookie');

        const logContext = error.getLogContext();
        logContext.code = CookieErrorCodes.mismatchedAntiForgeryTokenError;

        return error;
    }

    /*
     * Handle failed cookie decryption
     */
    public static fromMalformedCookieError(name: string, message: string): ClientError {

        const details = `Malformed cookie received: ${message}`;
        const error = ErrorFactory.createClient401Error(details);

        const logContext = error.getLogContext();
        logContext.code = CookieErrorCodes.cookieDecryptionError;
        logContext.name = name;

        return error;
    }

    /*
     * Handle failed cookie decryption
     */
    public static fromCookieDecryptionError(name: string, exception: any): ClientError {

        const details = `Cookie decryption failed: ${ErrorUtils.getExceptionDetailsMessage(exception)}`;
        const error = ErrorFactory.createClient401Error(details);

        const logContext = error.getLogContext();
        logContext.code = CookieErrorCodes.cookieDecryptionError;
        logContext.name = name;

        return error;
    }
}
