import {CustomClaims} from '../../plumbing-base';

/*
 * Extend core claims for this particular API
 */
export class SampleCustomClaims extends CustomClaims {

    private _userDatabaseId: string;
    private _isAdmin: boolean;
    private _regionsCovered: string[];

    public static importData(data: any): SampleCustomClaims {
        return new SampleCustomClaims(data.userDatabaseId, data.isAdmin, data.regionsCovered);
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

    public exportData(): any {

        return {
            'userDatabaseId': this._userDatabaseId,
            'isAdmin': this._isAdmin,
            'regionsCovered': this._regionsCovered,
        };
    }
}
