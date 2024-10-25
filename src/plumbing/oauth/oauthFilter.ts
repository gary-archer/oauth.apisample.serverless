import {inject, injectable} from 'inversify';
import {APIGatewayProxyEvent} from 'aws-lambda';
import {createHash} from 'crypto';
import {Cache} from '../cache/cache.js';
import {ClaimsPrincipal} from '../claims/claimsPrincipal.js';
import {ExtraClaimsProvider} from '../claims/extraClaimsProvider.js';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {AccessTokenValidator} from './accessTokenValidator.js';
import {BearerToken} from './bearerToken.js';

/*
 * A class to create the claims principal at the start of every secured request
 */
@injectable()
export class OAuthFilter {

    private readonly cache: Cache;
    private readonly accessTokenValidator: AccessTokenValidator;
    private readonly extraClaimsProvider: ExtraClaimsProvider;

    public constructor(
        @inject(BASETYPES.Cache) cache: Cache,
        @inject(BASETYPES.AccessTokenValidator) accessTokenValidator: AccessTokenValidator,
        @inject(BASETYPES.ExtraClaimsProvider) extraClaimsProvider: ExtraClaimsProvider) {

        this.cache = cache;
        this.accessTokenValidator = accessTokenValidator;
        this.extraClaimsProvider = extraClaimsProvider;
    }

    /*
     * Do the token validation and claims lookup
     */
    public async execute(event: APIGatewayProxyEvent): Promise<ClaimsPrincipal> {

        // First get the access token from the incoming request
        const accessToken = BearerToken.read(event);

        // On every lambda HTTP request we validate the JWT, in a zero trust manner
        const tokenClaims = await this.accessTokenValidator.execute(accessToken);

        // If cached results already exist for this token then return them immediately
        const accessTokenHash = createHash('sha256').update(accessToken).digest('hex');
        let extraClaims = await this.cache.getExtraUserClaims(accessTokenHash);
        if (extraClaims) {
            return new ClaimsPrincipal(tokenClaims, extraClaims);
        }

        // Look up extra claims not in the JWT access token when it is first received
        extraClaims = await this.extraClaimsProvider.lookupExtraClaims(tokenClaims);

        // Cache the extra claims for subsequent requests with the same access token
        await this.cache.setExtraUserClaims(accessTokenHash, extraClaims);

        // Return the final claims
        return new ClaimsPrincipal(tokenClaims, extraClaims);
    }
}
