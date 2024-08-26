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

    private readonly _cache: Cache;
    private readonly _accessTokenValidator: AccessTokenValidator;
    private readonly _extraClaimsProvider: ExtraClaimsProvider;

    public constructor(
        @inject(BASETYPES.Cache) cache: Cache,
        @inject(BASETYPES.AccessTokenValidator) accessTokenValidator: AccessTokenValidator,
        @inject(BASETYPES.ExtraClaimsProvider) extraClaimsProvider: ExtraClaimsProvider) {

        this._cache = cache;
        this._accessTokenValidator = accessTokenValidator;
        this._extraClaimsProvider = extraClaimsProvider;
    }

    /*
     * Do the token validation and claims lookup
     */
    public async execute(event: APIGatewayProxyEvent): Promise<ClaimsPrincipal> {

        // First get the access token from the incoming request
        const accessToken = BearerToken.read(event);

        // On every lambda HTTP request we validate the JWT, in a zero trust manner
        const tokenClaims = await this._accessTokenValidator.execute(accessToken);

        // If cached results already exist for this token then return them immediately
        const accessTokenHash = createHash('sha256').update(accessToken).digest('hex');
        let extraClaims = await this._cache.getExtraUserClaims(accessTokenHash);
        if (extraClaims) {
            return new ClaimsPrincipal(tokenClaims, extraClaims);
        }

        // Look up extra claims not in the JWT access token when it is first received
        extraClaims = await this._extraClaimsProvider.lookupExtraClaims(tokenClaims);

        // Cache the extra claims for subsequent requests with the same access token
        await this._cache.setExtraUserClaims(accessTokenHash, extraClaims);

        // Return the final claims
        return new ClaimsPrincipal(tokenClaims, extraClaims);
    }
}
