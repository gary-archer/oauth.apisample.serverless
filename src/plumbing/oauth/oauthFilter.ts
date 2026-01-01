import {inject, injectable} from 'inversify';
import {createHash} from 'crypto';
import {ClaimsCache} from '../claims/claimsCache';
import {ClaimsPrincipal} from '../claims/claimsPrincipal';
import {ExtraClaimsProvider} from '../claims/extraClaimsProvider';
import {BASETYPES} from '../dependencies/baseTypes';
import {APIGatewayProxyExtendedEvent} from '../utilities/apiGatewayExtendedProxyEvent';
import {AccessTokenValidator} from './accessTokenValidator';
import {BearerToken} from './bearerToken';

/*
 * A class to create the claims principal at the start of every secured request
 */
@injectable()
export class OAuthFilter {

    private readonly cache: ClaimsCache;
    private readonly accessTokenValidator: AccessTokenValidator;
    private readonly extraClaimsProvider: ExtraClaimsProvider;

    public constructor(
        @inject(BASETYPES.ClaimsCache) cache: ClaimsCache,
        @inject(BASETYPES.AccessTokenValidator) accessTokenValidator: AccessTokenValidator,
        @inject(BASETYPES.ExtraClaimsProvider) extraClaimsProvider: ExtraClaimsProvider) {

        this.cache = cache;
        this.accessTokenValidator = accessTokenValidator;
        this.extraClaimsProvider = extraClaimsProvider;
    }

    /*
     * Do the token validation and claims lookup
     */
    public async execute(event: APIGatewayProxyExtendedEvent): Promise<ClaimsPrincipal> {

        // First get the access token from the incoming request
        const accessToken = BearerToken.read(event);

        // On every lambda HTTP request we validate the JWT, in a zero trust mannerExtraClaims
        const jwtClaims = await this.accessTokenValidator.execute(accessToken);

        // If cached results already exist for this token then return them immediately
        const accessTokenHash = createHash('sha256').update(accessToken).digest('hex');
        let extraClaims = this.cache.getItem(accessTokenHash);
        if (extraClaims) {
            return new ClaimsPrincipal(jwtClaims, extraClaims);
        }

        // Look up extra claims not in the JWT access token when it is first received
        extraClaims = await this.extraClaimsProvider.lookupExtraClaims(jwtClaims, event);

        // Cache the extra claims for subsequent requests with the same access token
        this.cache.setItem(accessTokenHash, extraClaims, jwtClaims.exp || 0);

        // Return the final claims
        return new ClaimsPrincipal(jwtClaims, extraClaims);
    }
}
