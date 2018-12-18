import {Context} from 'aws-lambda';
import * as fs from 'fs-extra';
import {AppConfiguration} from '../shared/configuration/appConfiguration';
import {CompanyController} from './logic/companyController';
import {UserInfoController} from './logic/userInfoController';
import {Middleware} from './plumbing/middleware';

// Read configuration at startup
const apiConfigText = fs.readFileSync('api.config.json');
const config = JSON.parse(apiConfigText);
const appConfig = config.app as AppConfiguration;

// Configure the user claims operation
const getUserClaimsHandler = async (event: any, context: Context) => {
    const controller = new UserInfoController();
    return await controller.getUserClaims(event, context);
};

// Configure the get company list operation
const getCompanyListHandler = async (event: any, context: Context) => {
    const controller = new CompanyController();
    return await controller.getCompanyList(event, context);
};

// Configure the get company transactions operation
const getCompanyTransactionsHandler = async (event: any, context: Context) => {
    const controller = new CompanyController();
    return await controller.getCompanyTransactions(event, context);
};

// Apply middleware
const getUserClaims = Middleware.apply(getUserClaimsHandler, appConfig);
const getCompanyList = Middleware.apply(getCompanyListHandler, appConfig);
const getCompanyTransactions = Middleware.apply(getCompanyTransactionsHandler, appConfig);

// Export enriched functions
export {getUserClaims, getCompanyList, getCompanyTransactions};
