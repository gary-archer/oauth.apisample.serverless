import {inject, injectable} from 'inversify';
import {ClaimsPrincipal} from '../../plumbing/claims/claimsPrincipal';
import {ClaimsReader} from '../../plumbing/claims/claimsReader';
import {CustomClaimNames} from '../../plumbing/claims/customClaimNames';
import {BASETYPES} from '../../plumbing/dependencies/baseTypes';
import {ClientError} from '../../plumbing/errors/clientError';
import {ErrorFactory} from '../../plumbing/errors/errorFactory';
import {APPLICATIONTYPES} from '../dependencies/applicationTypes';
import {Company} from '../entities/company';
import {CompanyTransactions} from '../entities/companyTransactions';
import {ErrorCodes} from '../errors/errorCodes';
import {CompanyRepository} from '../repositories/companyRepository';

/*
 * The service class applies business authorization
 */
@injectable()
export class CompanyService {

    private readonly repository: CompanyRepository;
    private readonly claims: ClaimsPrincipal;

    public constructor(
        @inject(APPLICATIONTYPES.CompanyRepository) repository: CompanyRepository,
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

        // Apply a business rule that links the user's regions to the region of a company resource
        const found = this.claims.getExtra().regions.find((c) => c === company.region);
        return !!found;
    }

    /*
     * Return 404 for both not found items and also those that are not authorized
     */
    private unauthorizedError(companyId: number): ClientError {

        throw ErrorFactory.createClientError(
            404,
            ErrorCodes.companyNotFound,
            `Company ${companyId} was not found for this user`);
    }
}
