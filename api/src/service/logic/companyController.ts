import {Context} from 'aws-lambda';
import {ApiLogger} from '../../shared/plumbing/apiLogger';
import {ResponseHandler} from '../plumbing/responseHandler';
import {CompanyRepository} from './companyRepository';

/*
 * Our API controller runs after claims handling has completed and we can use claims for authorization
 */
export class CompanyController {

    /*
     * Return the list of companies
     */
    public static async getCompanyList(event: any, context: Context) {

        const repository = new CompanyRepository(event.claims);
        ApiLogger.info('CompanyController', 'Returning company list');

        const data = await repository.getCompanyList();
        return ResponseHandler.objectResponse(200, data);
    }

    /*
     * Return the transaction details for a company
     */
    public static async getCompanyTransactions(event: any, context: Context): Promise<any> {

        const repository = new CompanyRepository(event.claims);
        const id = parseInt(event.pathParameters.id, 10);
        ApiLogger.info('CompanyController', `Returning transactions for company ${id}`);

        // Get transactions, which will return null if the user is unauthorized
        const transactions =  await repository.getCompanyTransactions(id);
        if (transactions) {
            return ResponseHandler.objectResponse(200, transactions);
        }

        // Set a custom unauthorized response in a manner that gets through API gateway
        const error = {
            area: 'Authorization',
            message: 'The user is unauthorized to access the requested data',
        };
        return ResponseHandler.validationErrorResponse(403, error, context);
    }
}
