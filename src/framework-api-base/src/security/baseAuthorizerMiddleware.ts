import {Container} from 'inversify';
import {BASEFRAMEWORKTYPES} from '../../../framework-base';
import {ClientError} from '../errors/clientError';
import {LogEntryImpl} from '../logging/logEntryImpl';
import {CoreApiClaims} from './coreApiClaims';

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
