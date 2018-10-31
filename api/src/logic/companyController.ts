import {Company} from '../entities/company';
import {CompanyTransactions} from '../entities/companyTransactions';
import {Transaction} from '../entities/transaction';
import {ApiLogger} from '../plumbing/apiLogger';
import {CompanyRepository} from './companyRepository';

/*
 * Our API controller runs after claims handling has completed and we can use claims for authorization
 */
export class CompanyController {

    /*
     * Return the list of companies
     */
    public static async getCompanyList(): Promise<Company[]> {

        const repository = new CompanyRepository();
        ApiLogger.info('CompanyController', 'Returning company list');

        // Get data as entities
        return await repository.getCompanyList();
    }

    /*
     * Return the transaction details for a company
     */
    public static async getCompanyTransactions(): Promise<CompanyTransactions | null> {

        // Create a repository
        const repository = new CompanyRepository();
        // const id = parseInt(request.params.id, 10);
        const id = parseInt('2', 10);
        ApiLogger.info('CompanyController', `Request for transaction details for company: ${id}`);

        // Get data as entities and handle not found items
        return await repository.getCompanyTransactions(id);
    }
}
