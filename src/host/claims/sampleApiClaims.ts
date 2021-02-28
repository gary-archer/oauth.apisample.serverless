import {injectable} from 'inversify';
import {CoreApiClaims} from '../../plumbing-base';

/*
 * Extend the core claims
 */
@injectable()
export class SampleApiClaims extends CoreApiClaims {

    // Domain specific claims that control access to business data
    public isAdmin: boolean;
    public regionsCovered: string[];

    public constructor() {
        super();
        this.isAdmin = false;
        this.regionsCovered = [];
    }
}
