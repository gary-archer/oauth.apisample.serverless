import * as cors from 'cors';
import {Application, NextFunction, Request, Response} from 'express';
import {Configuration} from '../configuration/configuration';
import {ClaimsMiddleware} from '../plumbing/claimsMiddleware';
import {ErrorHandler} from '../plumbing/errorHandler';
import {ResponseWriter} from '../plumbing/responseWriter';
import {AuthorizationMicroservice} from './authorizationMicroservice';
import {CompanyController} from './companyController';
import {UserInfoController} from './userInfoController';

/*
 * A Web API class to manage routes
 */
export class WebApi {

    /*
     * Fields
     */
    private _expressApp: Application;
    private _apiConfig: Configuration;

    /*
     * Class setup
     */
    public constructor(expressApp: Application, apiConfig: Configuration) {

        // Basic class setup
        this._expressApp = expressApp;
        this._apiConfig = apiConfig;
        this._setupCallbacks();

        // For the code sample's ease of debugging we'll turn off caching
        this._expressApp.set('etag', false);

        // Allow cross origin requests from the SPA
        const corsOptions = { origin: apiConfig.app.trustedOrigins };
        this._expressApp.use('/api/*', cors(corsOptions));
    }

    /*
     * Set up Web API routes
     */
    public configureRoutes(): void {

        // All API requests are authorized first
        this._expressApp.get('/api/*', this._authorizeRequest);

        // Define routes for API operations
        this._expressApp.get('/api/userclaims/current', UserInfoController.getUserClaims);
        this._expressApp.get('/api/companies', CompanyController.getCompanyList);
        this._expressApp.get('/api/companies/:id([0-9]+)', CompanyController.getCompanyTransactions);

        // Handle exceptions
        this._expressApp.use('/api/*', this._unhandledExceptionMiddleware);
    }

    /*
     * The first middleware is for token validation and claims handling, which occurs before business logic
     */
    private async _authorizeRequest(request: Request, response: Response, next: NextFunction): Promise<void> {
        const middleware = new ClaimsMiddleware(this._apiConfig.oauth, new AuthorizationMicroservice());
        await middleware.authorizeRequestAndSetClaims(request, response, next);
    }

    /*
     * This does not catch promise based exceptions in async handling
     */
    private _unhandledExceptionMiddleware(
        unhandledException: any,
        request: Request,
        response: Response,
        next: NextFunction): void {

        // Report unhandled exceptions in a controlled manner
        const serverError = ErrorHandler.fromException(unhandledException);
        const [statusCode, clientError] = ErrorHandler.handleError(serverError);
        ResponseWriter.writeObject(response, statusCode, clientError);
    }

    /*
     * Set up async callbacks
     */
    private _setupCallbacks(): void {
        this._authorizeRequest = this._authorizeRequest.bind(this);
        this._unhandledExceptionMiddleware = this._unhandledExceptionMiddleware.bind(this);
    }
}
