import * as fs from 'fs-extra';
import middy from 'middy';
import {cors} from 'middy/middlewares';
import {Configuration} from './configuration/configuration';
import {AuthorizationMicroservice} from './logic/authorizationMicroservice';
import {CompanyController} from './logic/companyController';
import {UserInfoController} from './logic/userInfoController';
import {claimsMiddleware} from './plumbing/claimsMiddleware';
import {errorHandlingMiddleware} from './plumbing/errorHandlingMiddleware';

// First load configuration
const apiConfigText = fs.readFileSync('api.config.json');
const apiConfig = JSON.parse(apiConfigText) as Configuration;

// Create classes needed by middleware
const corsConfig = cors({origins: apiConfig.app.trustedOrigins});
const authorizationMicroservice = new AuthorizationMicroservice();

// Enrich business logic with middleware for security and error handling
const getUserClaims = middy(UserInfoController.getUserClaims)
    .use(corsConfig)
    .use(claimsMiddleware(apiConfig, authorizationMicroservice))
    .use(errorHandlingMiddleware());

const getCompanyList = middy(CompanyController.getCompanyList)
    .use(corsConfig)    
    .use(claimsMiddleware(apiConfig, authorizationMicroservice))
    .use(errorHandlingMiddleware());

const getCompanyTransactions = middy(CompanyController.getCompanyTransactions)
    .use(corsConfig)
    .use(claimsMiddleware(apiConfig, authorizationMicroservice))
    .use(errorHandlingMiddleware());

// Export enriched functions
export {getUserClaims, getCompanyList, getCompanyTransactions};
