import {APIGatewayEvent, Context} from 'aws-lambda';
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
    public static async getCompanyList(event: any, context: Context): Promise<any> {

        const repository = new CompanyRepository(event.claims);
        ApiLogger.info('CompanyController', 'Returning company list');

        const data = await repository.getCompanyList();
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    }

    /*
     * Return the transaction details for a company
     */
    public static async getCompanyTransactions(event: any, context: Context): Promise<any> {

        // Create a repository
        const repository = new CompanyRepository(event.claims);
        const id = event.pathParameters.id;
        ApiLogger.info('CompanyController', `Returning transactions for company ${id}`);

        const transactions =  await repository.getCompanyTransactions(id);
        if (transactions) {
            return {
                statusCode: 200,
                body: JSON.stringify(transactions),
            };
        } else {
            return {
                statusCode: 403,
                body: JSON.stringify('The user is unauthorized to access the requested data'),
            };
        }
    }
}