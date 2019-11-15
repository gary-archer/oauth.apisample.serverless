import {Container} from 'inversify';
import {BASEFRAMEWORKTYPES} from '../../../framework-base';
import {ClientError} from '../errors/clientError';
import {LogEntryImpl} from '../logging/logEntryImpl';
import {CoreApiClaims} from './coreApiClaims';

/*
 * A base authorization class, to handle common logic
 */
export abstract class BaseAuthorizerMiddleware {

    private readonly _container: Container;
    private readonly _logEntry: LogEntryImpl;

    public constructor(container: Container) {
        this._container = container;
        this._logEntry = this._container.get<LogEntryImpl>(BASEFRAMEWORKTYPES.LogEntry);
    }

    protected get container(): Container {
        return this._container;
    }

    /*
     * Include identity details in both authorizer and lambda logs
     */
    protected logIdentity(claims: CoreApiClaims) {
        this._logEntry.setIdentity(claims);
    }

    /*
     * Log any authorization failures
     */
    protected logUnauthorized(error: ClientError) {
        this._logEntry.setClientError(error);
    }
}
