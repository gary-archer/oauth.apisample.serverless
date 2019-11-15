import {injectable} from 'inversify';
import {CoreApiClaims} from '../../framework-api-base';

/*
 * Override the core claims to support additional custom claims
 */
@injectable()
export class SampleApiClaims extends CoreApiClaims {

    public regionsCovered: string[];

    public constructor() {
        super();
        this.regionsCovered = [];
    }
}
