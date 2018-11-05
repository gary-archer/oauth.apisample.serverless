import {Context} from 'aws-lambda';
import middy from 'middy';
import {cors, ICorsOptions} from 'middy/middlewares';
import {Configuration} from '../configuration/configuration';
import {AuthorizationMicroservice} from '../logic/authorizationMicroservice';
import {claimsMiddleware} from '../plumbing/claimsMiddleware';
import {errorHandlingMiddleware} from '../plumbing/errorHandlingMiddleware';

/*
 * Set up middleware
 */
export class MiddlewareHelper {

    private _apiConfig: Configuration;
    private _authorizationMicroservice: AuthorizationMicroservice;
    private _corsConfig: ICorsOptions;

    /*
     * Receive dependencies
     */
    public constructor(apiConfig: Configuration, authorizationMicroservice: AuthorizationMicroservice) {
        this._apiConfig = apiConfig;
        this._authorizationMicroservice = authorizationMicroservice;
        this._corsConfig = {origins: apiConfig.app.trustedOrigins};
    }

    /*
     * Add cross cutting concerns to enrich the API operation
     */
    public enrichApiOperation(operation: any): middy.IMiddy {

        return middy(operation)
            .use(cors(this._corsConfig))
            .use(claimsMiddleware(this._apiConfig, this._authorizationMicroservice))
            .use(errorHandlingMiddleware());
    }
}
