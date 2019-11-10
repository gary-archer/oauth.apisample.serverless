import * as fs from 'fs-extra';
import {ApiClaims} from '../../shared/entities/apiClaims';
import {ClientError} from '../../shared/entities/clientError';
import {JsonFileReader} from '../../shared/plumbing/jsonFileReader';
import {Company} from '../entities/company';
import {CompanyTransactions} from '../entities/companyTransactions';

/*
 * A simple API controller for getting data about a company and its investments
 */
export class CompanyRepository {

    /*
     * Injected dependencies
     */
    private _claims: ApiClaims;
    private _reader: JsonFileReader;

    /*
     * Receive dependencies
     */
    public constructor(claims: ApiClaims, reader: JsonFileReader) {
        this._claims = claims;
        this._reader = reader;
    }

    /*
     * Return the list of companies from a hard coded data file
     */
    public async getCompanyList(): Promise<Company[]> {

        // We will first get all data
        const companies = await this._reader.readFile<Company[]>('data/companyList.json');

        // We will then filter on only authorized companies
        const authorizedCompanies = companies.filter((c) => this._isUserAuthorizedForCompany(c.id));
        return authorizedCompanies;
    }

    /*
     * Return transactions for a company given its id
     */
    public async getCompanyTransactions(id: number): Promise<CompanyTransactions | null> {

        // In this case we'll return 404 so that the caller cannot distin
        if (!this._isUserAuthorizedForCompany(id)) {
            throw new ClientError(
                404,
                'company_not_found',
                `Transactions for company ${id} were not found for this user`);
        }

        // First read companies from the database
        const companyList = await this._reader.readFile<Company[]>('data/companyList.json');
        const foundCompany = companyList.find((c) => c.id === id);
        if (foundCompany) {

            // Next read transactions from the database
            const companyTransactions = await this._reader.readFile<CompanyTransactions[]>
                ('data/companyTransactions.json');

            // Then join the data
            const foundTransactions = companyTransactions.find((ct) => ct.id === id);
            if (foundTransactions) {
                foundTransactions.company = foundCompany;
                return foundTransactions;
            }
        }

        throw new ClientError(404, 'company_not_found', `Transactions for company ${id} were not found for this user`);
    }

    /*
     * Check that the user is allowed to access the data for this company
     * This uses claims that were read when the access token was first validated
     */
    private _isUserAuthorizedForCompany(companyId: number): boolean {
        const found = this._claims.userCompanyIds.find((c) => c === companyId);
        return !!found;
    }
}
