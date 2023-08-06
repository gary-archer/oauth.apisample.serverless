import {inject, injectable} from 'inversify';
import {ClaimsPrincipal} from '../../plumbing/claims/claimsPrincipal.js';
import {BASETYPES} from '../../plumbing/dependencies/baseTypes.js';
import {ClientError} from '../../plumbing/errors/clientError.js';
import {ErrorFactory} from '../../plumbing/errors/errorFactory.js';
import {SAMPLETYPES} from '../dependencies/sampleTypes.js';
import {Company} from '../entities/company.js';
import {CompanyTransactions} from '../entities/companyTransactions.js';
import {SampleCustomClaims} from '../entities/sampleCustomClaims.js';
import {SampleErrorCodes} from '../errors/sampleErrorCodes.js';
import {CompanyRepository} from '../repositories/companyRepository.js';

/*
 * Our service layer class applies business authorization
 */
@injectable()
export class CompanyService {

    private readonly _repository: CompanyRepository;
    private readonly _claims: SampleCustomClaims;

    public constructor(
        @inject(SAMPLETYPES.CompanyRepository) repository: CompanyRepository,
        @inject(BASETYPES.ClaimsPrincipal) claims: ClaimsPrincipal) {

        this._repository = repository;
        this._claims = claims.custom as SampleCustomClaims;
    }

    /*
     * Forward to the repository to get the company list
     */
    public async getCompanyList(): Promise<Company[]> {

        // Use a micro services approach of getting all data
        const companies = await this._repository.getCompanyList();

        // We will then filter on only authorized companies
        return companies.filter((c) => this._isUserAuthorizedForCompany(c));
    }

    /*
     * Forward to the repository to get the company transactions
     */
    public async getCompanyTransactions(companyId: number): Promise<CompanyTransactions> {

        // Use a micro services approach of getting all data
        const data = await this._repository.getCompanyTransactions(companyId);

        // If the user is unauthorized or data was not found then return 404
        if (!data || !this._isUserAuthorizedForCompany(data.company)) {
            throw this._unauthorizedError(companyId);
        }

        return data;
    }

    /*
     * A simple example of applying domain specific claims
     */
    private _isUserAuthorizedForCompany(company: Company): boolean {

        // First authorize based on the user role
        const isAdmin = this._claims.role.toLowerCase().indexOf('admin') !== -1;
        if (isAdmin) {
            return true;
        }

        // Next authorize based on a business rule that links the user to regional data
        const found = this._claims.regions.find((c) => c === company.region);
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
