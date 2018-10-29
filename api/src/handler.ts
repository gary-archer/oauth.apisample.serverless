import middy from 'middy';

/*
 * The lambda handler class
 */
class Handler {

    public async getCompanyList(event: any, context: any): Promise<any> {

        console.log('In getCompanyList');
        return {
            result: 'success',
            message: 'company list',
        };
    }

    public async getCompanyTransactions(event: any, context: any): Promise<any> {

        console.log('In getCompanyTransactions');
        return {
            result: 'success',
            message: 'company transactions',
        };
    }
}

const handler = new Handler();

const getCompanyList = middy(handler.getCompanyList);
const getCompanyTransactions = middy(handler.getCompanyTransactions);

export {getCompanyList, getCompanyTransactions};
