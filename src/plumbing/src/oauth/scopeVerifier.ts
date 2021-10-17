import {BaseErrorCodes} from '../errors/baseErrorCodes';
import {ErrorFactory} from '../errors/errorFactory';

/*
 * A utility method to enforce scopes
 */
export class ScopeVerifier {

    public static enforce(scopes: string[], requiredScope: string): void {

        if (!scopes.some((s) => s.indexOf(requiredScope) !== -1)) {

            throw ErrorFactory.createClientError(
                403,
                BaseErrorCodes.insufficientScope,
                'Access token does not have a valid scope for this API endpoint');
        }
    }
}
