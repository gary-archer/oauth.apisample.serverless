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

        const transactions =  await repository.getCompanyTransactions(id);
        if (transactions) {
            return ResponseHandler.objectResponse(200, transactions);
        }

        return CompanyController._unauthorizedError(context);
    }

    /*
     * Return an unauthorized error
     */
    private static _unauthorizedError(context: any) {

        // Set the error object to return from the lambda
        const error = {
            area: 'Authorization',
            message: 'The user is unauthorized to access the requested data',
        };
        const response = ResponseHandler.objectResponse(403, error);

        // Set the error object to return from the API gateway
        // The errorResponse property is double serialized against the context
        // The DEFAULT_4XX properties in Serverless.yml reference this object
        context.errorResponse = JSON.stringify(response.body);
        return response;
    }
}
