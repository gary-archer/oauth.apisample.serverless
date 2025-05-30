/*
 * Represents finer grained authorization values not issued to access tokens
 * These values are often easier to manage in APIs rather than the authorization server
 */
export class ExtraClaims {

    public title: string;
    public regions: string[];

    /*
     * The default constructor
     */
    public constructor() {
        this.title = '';
        this.regions = [];
    }

    /*
     * A static method for parameterized construction
     */
    public static create(title: string, regions: string[]): ExtraClaims {

        const claims = new ExtraClaims();
        claims.title = title;
        claims.regions = regions;
        return claims;
    }
}
