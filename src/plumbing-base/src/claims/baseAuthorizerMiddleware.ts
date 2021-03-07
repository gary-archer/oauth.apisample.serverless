import {Container} from 'inversify';
import {TokenClaims} from '../claims/tokenClaims';
import {BASETYPES} from '../dependencies/baseTypes';
import {ClientError} from '../errors/clientError';
import {LogEntryImpl} from '../logging/logEntryImpl';

/*
 * A base authorization class, to handle common logic
 */
export abstract class BaseAuthorizerMiddleware {

    /*
     * Include identity details in both authorizer and lambda logs
     */
    protected logIdentity(container: Container, claims: TokenClaims): void {
        const logEntry = container.get<LogEntryImpl>(BASETYPES.LogEntry);
        logEntry.setIdentity(claims);
    }

    /*
     * Log any authorization failures
     */
    protected logUnauthorized(container: Container, error: ClientError): void {
        const logEntry = container.get<LogEntryImpl>(BASETYPES.LogEntry);
        logEntry.setClientError(error);
        logEntry.setResponseStatus(401);
    }
}
