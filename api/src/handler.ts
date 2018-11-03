import * as fs from 'fs-extra';
import middy from 'middy';
import {Configuration} from './configuration/configuration';
import {CompanyController} from './logic/companyController';
import {UserInfoController} from './logic/userInfoController';
import {authorizationMiddleware} from './plumbing/authorizationMiddleware';
import {errorHandlingMiddleware} from './plumbing/errorHandlingMiddleware';

// First load configuration
const apiConfigText = fs.readFileSync('api.config.json');
const apiConfig = JSON.parse(apiConfigText) as Configuration;

// Enrich business logic with middleware for security and error handling
const getUserClaims = middy(UserInfoController.getUserClaims)
    .use(authorizationMiddleware(apiConfig))
    .use(errorHandlingMiddleware(apiConfig));

const getCompanyList = middy(CompanyController.getCompanyList)
    .use(authorizationMiddleware(apiConfig))
    .use(errorHandlingMiddleware(apiConfig));

const getCompanyTransactions = middy(CompanyController.getCompanyTransactions)
    .use(authorizationMiddleware(apiConfig))
    .use(errorHandlingMiddleware(apiConfig));

// Export enriched functions
export {getUserClaims, getCompanyList, getCompanyTransactions};
