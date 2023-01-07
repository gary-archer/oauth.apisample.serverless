import {CustomClaims} from '../../plumbing/claims/customClaims.js';

/*
 * Extend core claims for this particular API
 */
export class SampleCustomClaims extends CustomClaims {

    private _userId: string;
    private _userRole: string;
    private _userRegions: string[];

    public static importData(data: any): SampleCustomClaims {
        return new SampleCustomClaims(data.userId, data.userRole, data.userRegions);
    }

    public constructor(userId: string, userRole: string, userRegions: string[]) {
        super();
        this._userId = userId;
        this._userRole = userRole;
        this._userRegions = userRegions;
    }

    public get userId(): string {
        return this._userId;
    }

    public get userRole(): string {
        return this._userRole;
    }

    public get userRegions(): string[] {
        return this._userRegions;
    }

    public exportData(): any {

        return {
            'userId': this._userId,
            'userRole': this._userRole,
            'userRegions': this._userRegions,
        };
    }
}
