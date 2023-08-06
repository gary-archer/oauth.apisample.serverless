import {CustomClaims} from '../../plumbing/claims/customClaims.js';

/*
 * Extend core claims for this particular API
 */
export class SampleCustomClaims extends CustomClaims {

    private _managerId: string;
    private _role: string;
    private _regions: string[];

    public static importData(data: any): SampleCustomClaims {
        return new SampleCustomClaims(data.managerId, data.role, data.regions);
    }

    public constructor(managerId: string, role: string, regions: string[]) {
        super();
        this._managerId = managerId;
        this._role = role;
        this._regions = regions;
    }

    public get managerId(): string {
        return this._managerId;
    }

    public get role(): string {
        return this._role;
    }

    public get regions(): string[] {
        return this._regions;
    }

    public exportData(): any {

        return {
            'managerId': this._managerId,
            'role': this._role,
            'regions': this._regions,
        };
    }
}
