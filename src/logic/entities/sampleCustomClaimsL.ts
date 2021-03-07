import {CustomClaims} from '../../plumbing-base';

/*
 * Extend core claims for this particular API
 */
export class SampleCustomClaimsL extends CustomClaims {

    private _userDatabaseId: string;
    private _isAdmin: boolean;
    private _regionsCovered: string[];

    public static importData(data: any): SampleCustomClaimsL {
        return new SampleCustomClaimsL(data.userDatabaseId, data.isAdmin, data.regionsCovered);
    }

    public constructor(userDatabaseId: string, isAdmin: boolean, regionsCovered: string[]) {
        super();
        this._userDatabaseId = userDatabaseId;
        this._isAdmin = isAdmin;
        this._regionsCovered = regionsCovered;
    }

    public get userDatabaseId(): string {
        return this._userDatabaseId;
    }

    public get isAdmin(): boolean {
        return this._isAdmin;
    }

    public get regionsCovered(): string[] {
        return this._regionsCovered;
    }
}
