import * as fs from 'fs-extra';
import middy from 'middy';
import {cors} from 'middy/middlewares';
import {Configuration} from './configuration/configuration';
import {CompanyController} from './logic/companyController';
import {UserInfoController} from './logic/userInfoController';
import {authorizationMiddleware} from './plumbing/authorizationMiddleware';
import {errorHandlingMiddleware} from './plumbing/errorHandlingMiddleware';

// First load configuration
const apiConfigText = fs.readFileSync('api.config.json');
const apiConfig = JSON.parse(apiConfigText) as Configuration;

// Allow cross origin requests from our web domain
const corsConfig = cors({origins: apiConfig.app.trustedOrigins});

// Enrich business logic with middleware for security and error handling
const getUserClaims = middy(UserInfoController.getUserClaims)
    .use(corsConfig)
    .use(authorizationMiddleware(apiConfig))
    .use(errorHandlingMiddleware(apiConfig));

const getCompanyList = middy(CompanyController.getCompanyList)
    .use(corsConfig)    
    .use(authorizationMiddleware(apiConfig))
    .use(errorHandlingMiddleware(apiConfig));

const getCompanyTransactions = middy(CompanyController.getCompanyTransactions)
    .use(corsConfig)
    .use(authorizationMiddleware(apiConfig))
    .use(errorHandlingMiddleware(apiConfig));

// Export enriched functions
export {getUserClaims, getCompanyList, getCompanyTransactions};
