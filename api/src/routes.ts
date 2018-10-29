import {APIGatewayEvent, Context} from 'aws-lambda';
import middy from 'middy';

/*
 * Define lambda routes
 */
class Routes {

    public async getCompanyList(event: APIGatewayEvent, context: Context): Promise<any> {

        console.log('In getCompanyList');
        return {
            result: 'success',
            message: 'company list',
        };
    }

    public async getCompanyTransactions(event: APIGatewayEvent, context: Context): Promise<any> {

        console.log('In getCompanyTransactions');
        return {
            result: 'success',
            message: 'company transactions',
        };
    }
}

/*
 * Plug in middleware
 */
const routes = new Routes();
const getCompanyList = middy(routes.getCompanyList);
const getCompanyTransactions = middy(routes.getCompanyTransactions);

/*
 * Export results
 */
export {getCompanyList, getCompanyTransactions};
