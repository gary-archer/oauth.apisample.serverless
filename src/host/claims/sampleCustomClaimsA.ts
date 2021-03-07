import {CustomClaims} from '../../plumbing-base';

/*
 * Extend core claims for this particular API
 */
export class SampleCustomClaimsA extends CustomClaims {

    private _userDatabaseId: string;
    private _isAdmin: boolean;
    private _regionsCovered: string[];

    public constructor(userDatabaseId: string, isAdmin: boolean, regionsCovered: string[]) {
        super();
        this._userDatabaseId = userDatabaseId;
        this._isAdmin = isAdmin;
        this._regionsCovered = regionsCovered;
    }

    public exportData(): any {

        return {
            'userDatabaseId': this._userDatabaseId,
            'isAdmin': this._isAdmin,
            'regionsCovered': this._regionsCovered,
        };
    }
}
