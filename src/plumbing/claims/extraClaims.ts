/*
 * Claims that you cannot, or do not want to, manage in the authorization server
 */
export class ExtraClaims {

    /* eslint-disable @typescript-eslint/no-unused-vars */
    public static importData(data: any): ExtraClaims {
        return new ExtraClaims();
    }

    public exportData(): any {
        return {};
    }
}
