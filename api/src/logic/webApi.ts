import {APIGatewayEvent, Context} from 'aws-lambda';
import {CompanyController} from './companyController';

/*
 * Entry points for business logic
 */
export class WebApi {

    public async getCompanyList(event: APIGatewayEvent, context: Context): Promise<any> {

        console.log('*** DEBUG: WebApi');
        const data = await  CompanyController.getCompanyList();
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    }

    public async getCompanyTransactions(event: APIGatewayEvent, context: Context): Promise<any> {

        console.log('*** DEBUG: WebApi');
        const data = await  CompanyController.getCompanyTransactions();
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    }
}
