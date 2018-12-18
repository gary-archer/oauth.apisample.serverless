import {Context} from 'aws-lambda';
import {ClientError} from '../../shared/entities/clientError';
import {ResponseHandler} from '../../shared/plumbing/responseHandler';
import {CompanyRepository} from './companyRepository';

/*
 * Our API controller runs after claims handling has completed and we can use claims for authorization
 */
export class CompanyController {

    /*
     * Return the list of companies
     */
    public async getCompanyList(event: any, context: Context) {

        const repository = new CompanyRepository(event.claims);

        // Add to the request log
        event.log.debug('CompanyController', 'Returning company list');

        const data = await repository.getCompanyList();
        return ResponseHandler.objectResponse(200, data);
    }

    /*
     * Return the transaction details for a company
     */
    public async getCompanyTransactions(event: any, context: Context): Promise<any> {

        const repository = new CompanyRepository(event.claims);
        const id = parseInt(event.pathParameters.id, 10);

        // Add to the request log
        event.log.debug('CompanyController', `Returning transactions for company ${id}`);

        // Get transactions, which will return null if the user is unauthorized
        const transactions =  await repository.getCompanyTransactions(id);
        if (transactions) {
            return ResponseHandler.objectResponse(200, transactions);
        }

        // Throw a custom unauthorized response in a manner that gets through API gateway
        throw new ClientError(403, 'Authorization', 'The user is unauthorized to access the requested data');
    }
}
