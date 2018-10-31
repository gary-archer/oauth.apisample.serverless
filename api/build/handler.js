"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const middy_1 = __importDefault(require("middy"));
const webApi_1 = require("./logic/webApi");
const authorizationMiddleware_1 = require("./plumbing/authorizationMiddleware");
const errorHandlingMiddleware_1 = require("./plumbing/errorHandlingMiddleware");
// Create the class to manage business logic entry points
const webApi = new webApi_1.WebApi();
/*
 * Add middleware for security and error handling
 */
const getCompanyList = middy_1.default(webApi.getCompanyList)
    .use(authorizationMiddleware_1.authorizationMiddleware(null))
    .use(errorHandlingMiddleware_1.errorHandlingMiddleware(null));
exports.getCompanyList = getCompanyList;
const getCompanyTransactions = middy_1.default(webApi.getCompanyTransactions)
    .use(authorizationMiddleware_1.authorizationMiddleware(null))
    .use(errorHandlingMiddleware_1.errorHandlingMiddleware(null));
exports.getCompanyTransactions = getCompanyTransactions;
