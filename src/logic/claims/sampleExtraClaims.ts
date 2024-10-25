import {ExtraClaims} from '../../plumbing/claims/extraClaims.js';

/*
 * Represents extra claims not received in AWS Cognito access tokens
 */
export class SampleExtraClaims extends ExtraClaims {

    private readonly title: string;
    private readonly regions: string[];

    public static importData(data: any): SampleExtraClaims {
        return new SampleExtraClaims(data.title, data.regions);
    }

    public constructor(title: string, regions: string[]) {
        super();
        this.title = title;
        this.regions = regions;
    }

    public getTitle(): string {
        return this.title;
    }

    public getRegions(): string[] {
        return this.regions;
    }

    public exportData(): any {

        return {
            title: this.title,
            regions: this.regions,
        };
    }
}
