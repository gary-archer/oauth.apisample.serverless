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

// Set up the authorize operation
const authorizationMicroservice = new AuthorizationMicroservice();
const claimsHandler = new ClaimsHandler(apiConfig.oauth, authorizationMicroservice);
const authorize = claimsHandler.authorizeRequestAndSetClaims;

// Set up business operations
const helper = new MiddlewareHelper(apiConfig);
const getUserClaims = helper.enrichApiOperation(UserInfoController.getUserClaims);
const getCompanyList = helper.enrichApiOperation(CompanyController.getCompanyList);
const getCompanyTransactions = helper.enrichApiOperation(CompanyController.getCompanyTransactions);

// Export enriched functions
export {authorize, getUserClaims, getCompanyList, getCompanyTransactions};
