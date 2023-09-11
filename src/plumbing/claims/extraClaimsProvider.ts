import {injectable} from 'inversify';
import {JWTPayload} from 'jose';
import {ExtraClaims} from './extraClaims.js';

/*
 * Add extra claims that you cannot, or do not want to, manage in the authorization server
 */
@injectable()
export class ExtraClaimsProvider {

    /*
     * Get additional claims from the API's own database
     */
    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async lookupExtraClaims(jwtClaims: JWTPayload): Promise<ExtraClaims> {
        return new ExtraClaims();
    }

    /*
     * Deserialize extra claims after they have been read from the cache
     */
    public deserializeFromCache(data: any): ExtraClaims {
        return ExtraClaims.importData(data);
    }
}
