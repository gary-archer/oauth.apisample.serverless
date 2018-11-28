import * as fs from 'fs-extra';
import {AppConfiguration} from '../shared/configuration/appConfiguration';
import {CompanyController} from './logic/companyController';
import {UserInfoController} from './logic/userInfoController';
import {MiddlewareHelper} from './plumbing/middlewareHelper';

// Read configuration
const apiConfigText = fs.readFileSync('api.config.json');
const config = JSON.parse(apiConfigText);
const appConfig = config.app as AppConfiguration;

// Set up business operations
const helper = new MiddlewareHelper(appConfig);
const getUserClaims = helper.enrichApiOperation(UserInfoController.getUserClaims);
const getCompanyList = helper.enrichApiOperation(CompanyController.getCompanyList);
const getCompanyTransactions = helper.enrichApiOperation(CompanyController.getCompanyTransactions);

// Export enriched functions
export {getUserClaims, getCompanyList, getCompanyTransactions};
