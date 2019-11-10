import {Context} from 'aws-lambda';
import {ClientError} from '../../shared/entities/clientError';
import {ResponseHandler} from '../../shared/plumbing/responseHandler';
import {CompanyRepository} from './companyRepository';

/*
 * Our API controller runs after claims handling has completed and we can use claims for authorization
 */
export class CompanyController {

    /*
     * Injected depdendencies
     */
    private _repository: CompanyRepository;

    /*
     * Receive dependencies
     */
    public constructor(repository: CompanyRepository) {
        this._repository = repository;
    }

    /*
     * Return the list of companies
     */
    public async getCompanyList(event: any, context: Context) {

        // Add to the request log
        event.log.debug('CompanyController', 'Returning company list');

        // Get the company list, which will only return entries allowed for the user in the access token
        const data = await this._repository.getCompanyList();
        return ResponseHandler.objectResponse(200, data);
    }

    /*
     * Return the transaction details for a company
     */
    public async getCompanyTransactions(event: any, context: Context): Promise<any> {

        // Add to the request log
        const id = parseInt(event.pathParameters.id, 10);
        if (isNaN(id) || id <= 0) {

            // Throw a 400 error if we have an invalid id
            throw new ClientError(
                400,
                'invalid_company_id',
                'The company id must be a positive numeric integer');
        }

        // Add to the request log
        event.log.debug('CompanyController', `Returning transactions for company ${id}`);

        // Get transactions, which will throw an error if the user in the access token is unauthorized
        const transactions = await this._repository.getCompanyTransactions(id);
        return ResponseHandler.objectResponse(200, transactions);
    }
}
