"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
/*
 * A simple API controller for getting data about a company and its investments
 */
class CompanyRepository {
    /*
     * Every API request receives our complex claims which are only calculated when the token is first received
     */
    // private _claims: ApiClaims;
    /*
     * Receive claims when constructed
     */
    constructor( /*claims: ApiClaims*/) {
        // this._claims = claims;
    }
    /*
     * Return the list of companies from a hard coded data file
     */
    getCompanyList() {
        return __awaiter(this, void 0, void 0, function* () {
            // We will first get all data
            const companiesText = yield fs.readFile('data/companyList.json');
            const companies = JSON.parse(companiesText);
            // throw new Error('It all went horribly wrong!');
            // We will then filter on only authorized companies
            const authorizedCompanies = companies.filter((c) => this._isUserAuthorizedForCompany(c.id));
            return authorizedCompanies;
        });
    }
    /*
     * Return transactions for a company given its id
     */
    getCompanyTransactions(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // If the user is unauthorized we do not return any data
            if (!this._isUserAuthorizedForCompany(id)) {
                return null;
            }
            // First read companies from the database
            const companiesText = yield fs.readFile('data/companyList.json');
            const companyList = JSON.parse(companiesText);
            const foundCompany = companyList.find((c) => c.id === id);
            if (foundCompany) {
                // Next read transactions from the database
                const companyTransactionsText = yield fs.readFile('data/companyTransactions.json');
                const companyTransactions = JSON.parse(companyTransactionsText);
                // Then join the data
                const foundTransactions = companyTransactions.find((ct) => ct.id === id);
                if (foundTransactions) {
                    foundTransactions.company = foundCompany;
                    return foundTransactions;
                }
            }
            return null;
        });
    }
    /*
     * Apply claims that were read when the access token was first validated
     */
    _isUserAuthorizedForCompany(companyId) {
        // const found = this._claims.userCompanyIds.find((c) => c === companyId);
        // return !!found;
        return true;
    }
}
exports.CompanyRepository = CompanyRepository;
