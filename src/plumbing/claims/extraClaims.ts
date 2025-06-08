/*
 * Represents extra authorization values not received in access tokens
 */
export class ExtraClaims {

    public title: string;
    public regions: string[];

    /*
     * The default constructor for deserialization
     */
    public constructor() {
        this.title = '';
        this.regions = [];
    }

    /*
     * Construct with values from the API's own data
     */
    public static create(title: string, regions: string[]): ExtraClaims {

        const claims = new ExtraClaims();
        claims.title = title;
        claims.regions = regions;
        return claims;
    }
}
