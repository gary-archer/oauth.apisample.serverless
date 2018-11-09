import * as fs from 'fs-extra';
import {Configuration} from './configuration/configuration';
import {AuthorizationMicroservice} from './logic/authorizationMicroservice';
import {CompanyController} from './logic/companyController';
import {UserInfoController} from './logic/userInfoController';
import {ClaimsHandler} from './plumbing/claimsHandler';
import {MiddlewareHelper} from './plumbing/middlewareHelper';

// Initialize
const apiConfigText = fs.readFileSync('api.config.json');
const apiConfig = JSON.parse(apiConfigText) as Configuration;

// Create a helper to wire up middleware
const authorizationMicroservice = new AuthorizationMicroservice();
const helper = new MiddlewareHelper(apiConfig, authorizationMicroservice);

// Set up the authorize operation
const claimsHandler = new ClaimsHandler(apiConfig.oauth, authorizationMicroservice);
const authorize = helper.enrichAuthOperation(claimsHandler.authorizeRequestAndSetClaims);

// Set up business operationss
const getUserClaims = helper.enrichApiOperation(UserInfoController.getUserClaims);
const getCompanyList = helper.enrichApiOperation(CompanyController.getCompanyList);
const getCompanyTransactions = helper.enrichApiOperation(CompanyController.getCompanyTransactions);

// Export enriched functions
export {authorize, getUserClaims, getCompanyList, getCompanyTransactions};
