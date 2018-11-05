import * as fs from 'fs-extra';
import {Configuration} from './configuration/configuration';
import {AuthorizationMicroservice} from './logic/authorizationMicroservice';
import {CompanyController} from './logic/companyController';
import {UserInfoController} from './logic/userInfoController';
import {MiddlewareHelper} from './plumbing/middlewareHelper';

// Initialize
const apiConfigText = fs.readFileSync('api.config.json');
const apiConfig = JSON.parse(apiConfigText) as Configuration;
const authorizationMicroservice = new AuthorizationMicroservice();

// Create a helper for middleware
const helper = new MiddlewareHelper(apiConfig, authorizationMicroservice);

// Enrich business operations with middleware
const getUserClaims = helper.enrichApiOperation(UserInfoController.getUserClaims);
const getCompanyList = helper.enrichApiOperation(CompanyController.getCompanyList);
const getCompanyTransactions = helper.enrichApiOperation(CompanyController.getCompanyTransactions);

// Export enriched functions
export {getUserClaims, getCompanyList, getCompanyTransactions};
