"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const apiLogger_1 = require("../plumbing/apiLogger");
const companyRepository_1 = require("./companyRepository");
/*
 * Our API controller runs after claims handling has completed and we can use claims for authorization
 */
class CompanyController {
    /*
     * Return the list of companies
     */
    static getCompanyList() {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = new companyRepository_1.CompanyRepository();
            apiLogger_1.ApiLogger.info('CompanyController', 'Returning company list');
            // Get data as entities
            return yield repository.getCompanyList();
        });
    }
    /*
     * Return the transaction details for a company
     */
    static getCompanyTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            // Create a repository
            const repository = new companyRepository_1.CompanyRepository();
            // const id = parseInt(request.params.id, 10);
            const id = parseInt('2', 10);
            apiLogger_1.ApiLogger.info('CompanyController', `Request for transaction details for company: ${id}`);
            // Get data as entities and handle not found items
            return yield repository.getCompanyTransactions(id);
        });
    }
}
exports.CompanyController = CompanyController;
