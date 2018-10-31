import middy from 'middy';
import {WebApi} from './logic/webApi';
import {authorizationMiddleware} from './plumbing/authorizationMiddleware';
import {errorHandlingMiddleware} from './plumbing/errorHandlingMiddleware';

// Create the class to manage business logic entry points
const webApi = new WebApi();

/*
 * Add middleware for security and error handling
 */
const getCompanyList = middy(webApi.getCompanyList)
    .use(authorizationMiddleware(null))
    .use(errorHandlingMiddleware(null));

const getCompanyTransactions = middy(webApi.getCompanyTransactions)
    .use(authorizationMiddleware(null))
    .use(errorHandlingMiddleware(null));

/*
 * Export results
 */
export {getCompanyList, getCompanyTransactions};
