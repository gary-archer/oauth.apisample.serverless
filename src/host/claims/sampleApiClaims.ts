import {injectable} from 'inversify';
import {ApiClaims} from '../../framework-api-base';

/*
 * Override the core claims to support additional custom claims
 */
@injectable()
export class SampleApiClaims extends ApiClaims {

    private _regionsCovered2!: string[];

    public get regionsCovered2(): string[] {
        return this._regionsCovered2;
    }

    public set regionsCovered2(regionsCovered: string[]) {
        this._regionsCovered2 = regionsCovered;
    }
}
