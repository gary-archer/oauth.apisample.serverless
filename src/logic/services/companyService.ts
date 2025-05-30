import {inject, injectable} from 'inversify';
import {ClaimsPrincipal} from '../../plumbing/claims/claimsPrincipal.js';
import {ClaimsReader} from '../../plumbing/claims/claimsReader.js';
import {BASETYPES} from '../../plumbing/dependencies/baseTypes.js';
import {ClientError} from '../../plumbing/errors/clientError.js';
import {ErrorFactory} from '../../plumbing/errors/errorFactory.js';
import {CustomClaimNames} from '../claims/customClaimNames.js';
import {ExtraClaims} from '../claims/extraClaims.js';
import {SAMPLETYPES} from '../dependencies/sampleTypes.js';
import {Company} from '../entities/company.js';
import {CompanyTransactions} from '../entities/companyTransactions.js';
import {ErrorCodes} from '../errors/errorCodes.js';
import {CompanyRepository} from '../repositories/companyRepository.js';

/*
 * The service class applies business authorization
 */
@injectable()
export class CompanyService {

    private readonly repository: CompanyRepository;
    private readonly claims: ClaimsPrincipal;

    public constructor(
        @inject(SAMPLETYPES.CompanyRepository) repository: CompanyRepository,
        @inject(BASETYPES.ClaimsPrincipal) claims: ClaimsPrincipal) {

        this.repository = repository;
        this.claims = claims;
    }

    /*
     * Forward to the repository to get the company list
     */
    public async getCompanyList(): Promise<Company[]> {

        // Use a micro services approach of getting all data
        const companies = await this.repository.getCompanyList();

        // We will then filter on only authorized companies
        return companies.filter((c) => this.isUserAuthorizedForCompany(c));
    }

    /*
     * Forward to the repository to get the company transactions
     */
    public async getCompanyTransactions(companyId: number): Promise<CompanyTransactions> {

        // Use a micro services approach of getting all data
        const data = await this.repository.getCompanyTransactions(companyId);

        // If the user is unauthorized or data was not found then return 404
        if (!data || !this.isUserAuthorizedForCompany(data.company)) {
            throw this.unauthorizedError(companyId);
        }

        return data;
    }

    /*
     * A simple example of applying domain specific claims
     */
    private isUserAuthorizedForCompany(company: Company): boolean {

        // The admin role is granted access to all resources
        const role = ClaimsReader.getStringClaim(this.claims.getJwt(), CustomClaimNames.role).toLowerCase();
        if (role === 'admin') {
            return true;
        }

        // Unknown roles are granted no access to resources
        if (role !== 'user') {
            return false;
        }

        // For the user role, authorize based on a business rule that links the user to regional data
        const extraClaims = this.claims.getExtra() as ExtraClaims;
        const found = extraClaims.regions.find((c) => c === company.region);
        return !!found;
    }

    /*
     * Return a 404 error if the user is not authorized
     * Requests for both unauthorized and non existent data are treated the same
     */
    private unauthorizedError(companyId: number): ClientError {

        throw ErrorFactory.createClientError(
            404,
            ErrorCodes.companyNotFound,
            `Company ${companyId} was not found for this user`);
    }
}
