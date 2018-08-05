import {Request, Response} from 'express';
import {ApiLogger} from '../plumbing/apiLogger';
import {ErrorHandler} from '../plumbing/errorHandler';
import {ResponseWriter} from '../plumbing/responseWriter';
import {StartupCompanyRepository} from './startupCompanyRepository';

/*
 * Our API controller runs after claims handling has completed and we can use claims for authorization
 */
export class StartupCompanyController {

    /*
     * Return the list of startup companies
     */
    public static async getCompanyList(request: Request, response: Response): Promise<void> {

        try {
            // Create a repository and give it claims
            const repository = new StartupCompanyRepository(response.locals.claims);
            ApiLogger.info('StartupCompanyController', 'Returning company list');

            // Get data as entities
            const companies = await repository.getCompanyList();
            ResponseWriter.writeObject(response, 200, companies);

        } catch (e) {

            // Ensure promises are rejected correctly
            const serverError = ErrorHandler.fromException(e);
            const [statusCode, clientError] = ErrorHandler.handleError(serverError);
            ResponseWriter.writeObject(response, statusCode, clientError);
        }
    }

    /*
     * Return the transaction details for a startup company
     */
    public static async getCompanyTransactions(request: Request, response: Response): Promise<void> {

        try {
            // Create a repository
            const repository = new StartupCompanyRepository(response.locals.claims);
            const id = parseInt(request.params.id, 10);
            ApiLogger.info('API call', `Request for transaction details for company: ${id}`);

            // Get data as entities and handle not found items
            const transactions = await repository.getCompanyTransactions(id);
            if (transactions) {
                ResponseWriter.writeObject(response, 200, transactions);
            } else {
                ResponseWriter.writeObject(response, 403, 'The user is unauthorized to access the requested data');
            }

        } catch (e) {

            // Ensure promises are rejected correctly
            const serverError = ErrorHandler.fromException(e);
            const [statusCode, clientError] = ErrorHandler.handleError(serverError);
            ResponseWriter.writeObject(response, statusCode, clientError);
        }
    }
}
