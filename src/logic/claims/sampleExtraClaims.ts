import {ExtraClaims} from '../../plumbing/claims/extraClaims.js';

/*
 * Represents extra claims not received in AWS Cognito access tokens
 */
export class SampleExtraClaims extends ExtraClaims {

    private _managerId: string;
    private _role: string;
    private readonly _title: string;
    private readonly _regions: string[];

    public static importData(data: any): SampleExtraClaims {
        return new SampleExtraClaims(data.managerId, data.role, data.title, data.regions);
    }

    public constructor(managerId: string, role: string, title: string, regions: string[]) {
        super();
        this._managerId = managerId;
        this._role = role;
        this._title = title;
        this._regions = regions;
    }

    public get managerId(): string {
        return this._managerId;
    }

    public get role(): string {
        return this._role;
    }

    public get title(): string {
        return this._title;
    }

    public get regions(): string[] {
        return this._regions;
    }

    public exportData(): any {

        return {
            managerId: this._managerId,
            role: this._role,
            title: this._title,
            regions: this._regions,
        };
    }
}
