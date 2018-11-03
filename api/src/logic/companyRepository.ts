import * as fs from 'fs-extra';
import {ApiClaims} from '../entities/apiClaims';
import {Company} from '../entities/company';
import {CompanyTransactions} from '../entities/companyTransactions';

/*
 * A simple API controller for getting data about a company and its investments
 */
export class CompanyRepository {

    /*
     * Every API request receives our complex claims which are only calculated when the token is first received
     */
    private _claims: ApiClaims;

    /*
     * Receive claims when constructed
     */
    public constructor(claims: ApiClaims) {
        this._claims = claims;
    }

    /*
     * Return the list of companies from a hard coded data file
     */
    public async getCompanyList(): Promise<Company[]> {

        // We will first get all data
        const companiesText = await fs.readFile('data/companyList.json');
        const companies = JSON.parse(companiesText) as Company[];

        // We will then filter on only authorized companies
        const authorizedCompanies = companies.filter((c) => this._isUserAuthorizedForCompany(c.id));
        return authorizedCompanies;
    }

    /*
     * Return transactions for a company given its id
     */
    public async getCompanyTransactions(id: number): Promise<CompanyTransactions | null> {

        // If the user is unauthorized we do not return any data
        if (!this._isUserAuthorizedForCompany(id)) {
            return null;
        }

        // First read companies from the database
        const companiesText = await fs.readFile('data/companyList.json');
        const companyList = JSON.parse(companiesText) as Company[];

        const foundCompany = companyList.find((c) => c.id === id);
        if (foundCompany) {

            // Next read transactions from the database
            const companyTransactionsText = await fs.readFile('data/companyTransactions.json');
            const companyTransactions = JSON.parse(companyTransactionsText) as CompanyTransactions[];

            // Then join the data
            const foundTransactions = companyTransactions.find((ct) => ct.id === id);
            if (foundTransactions) {
                foundTransactions.company = foundCompany;
                return foundTransactions;
            }
        }

        return null;
    }

    /*
     * Apply claims that were read when the access token was first validated
     */
    private _isUserAuthorizedForCompany(companyId: number): boolean {
        const found = this._claims.userCompanyIds.find((c) => c === companyId);
        return !!found;
    }
}
