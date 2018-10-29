/*
 * The main handler for incoming routes
 */
import middy from 'middy';

/*
const routes = [
    "getCompanyList", CompanyController.getCompanyList,
    "getCompanyTransactions", CompanyController.getCompanyTransactions
]
*/

const getCompanyList = async (event: any, context: any): Promise<any> => {

    console.log('In getCompanyList');
    return {
        result: 'success',
        message: 'company list',
    };
};

const getCompanyTransactions = async (event: any, context: any): Promise<any> => {

    console.log('In getCompanyTransactions');
    return {
        result: 'success',
        message: 'company transactions',
    };
};

const handler1 = middy(getCompanyList);
const handler2 = middy(getCompanyTransactions);
export {handler1};
