import {injectable} from 'inversify';
import {CoreApiClaims} from '../../framework-api-base';

/*
 * Override the core claims to support additional custom claims
 */
@injectable()
export class SampleApiClaims extends CoreApiClaims {

    private _regionsCovered!: string[];

    public get regionsCovered(): string[] {
        return this._regionsCovered;
    }

    public set regionsCovered(regionsCovered: string[]) {
        this._regionsCovered = regionsCovered;
    }
}
