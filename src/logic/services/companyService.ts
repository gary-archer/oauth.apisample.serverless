import {inject, injectable} from 'inversify';
import {ClientError, ErrorFactory} from '../../plumbing-base';
import {SAMPLETYPES} from '../dependencies/sampleTypes';
import {Company} from '../entities/company';
import {CompanyTransactions} from '../entities/companyTransactions';
import {SampleErrorCodes} from '../errors/sampleErrorCodes';
import {CompanyRepository} from '../repositories/companyRepository';

/*
 * Our service layer class applies business authorization
 */
@injectable()
export class CompanyService {

    private readonly _repository: CompanyRepository;

    public constructor(@inject(SAMPLETYPES.CompanyRepository) repository: CompanyRepository) {
        this._repository = repository;
    }

    /*
     * Forward to the repository to get the company list
     */
    public async getCompanyList(isAdmin: boolean, regionsCovered: string[]): Promise<Company[]> {

        // Use a micro services approach of getting all data
        const companies = await this._repository.getCompanyList();

        // We will then filter on only authorized companies
        return companies.filter((c) => this._isUserAuthorizedForCompany(c, isAdmin, regionsCovered));
    }

    /*
     * Forward to the repository to get the company transactions
     */
    public async getCompanyTransactions(
        companyId: number,
        isAdmin: boolean,
        regionsCovered: string[]): Promise<CompanyTransactions> {

        // Use a micro services approach of getting all data
        const data = await this._repository.getCompanyTransactions(companyId);

        // If the user is unauthorized or data was not found then return 404
        if (!data || !this._isUserAuthorizedForCompany(data.company, isAdmin, regionsCovered)) {
            throw this._unauthorizedError(companyId);
        }

        return data;
    }

    /*
     * A simple example of applying domain specific claims
     */
    private _isUserAuthorizedForCompany(company: Company, isAdmin: boolean, regionsCovered: string[]): boolean {

        if (isAdmin) {
            return true;
        }

        const found = regionsCovered.find((c) => c === company.region);
        return !!found;
    }

    /*
     * Return a 404 error if the user is not authorized
     * Requests for both unauthorized and non existent data are treated the same
     */
    private _unauthorizedError(companyId: number): ClientError {

        throw ErrorFactory.createClientError(
            404,
            SampleErrorCodes.companyNotFound,
            `Company ${companyId} was not found for this user`);
    }
}
