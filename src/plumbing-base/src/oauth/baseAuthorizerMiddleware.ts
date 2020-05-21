import {Container} from 'inversify';
import {CoreApiClaims} from '../claims/coreApiClaims';
import {BASEFRAMEWORKTYPES} from '../configuration/baseFrameworkTypes';
import {ClientError} from '../errors/clientError';
import {LogEntryImpl} from '../logging/logEntryImpl';

/*
 * A base authorization class, to handle common logic
 */
export abstract class BaseAuthorizerMiddleware {

    /*
     * Include identity details in both authorizer and lambda logs
     */
    protected logIdentity(container: Container, claims: CoreApiClaims) {
        const logEntry = container.get<LogEntryImpl>(BASEFRAMEWORKTYPES.LogEntry);
        logEntry.setIdentity(claims);
    }

    /*
     * Log any authorization failures
     */
    protected logUnauthorized(container: Container, error: ClientError) {
        const logEntry = container.get<LogEntryImpl>(BASEFRAMEWORKTYPES.LogEntry);
        logEntry.setClientError(error);
        logEntry.setResponseStatus(401);
    }
}
