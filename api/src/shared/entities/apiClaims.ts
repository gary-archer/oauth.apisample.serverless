import {UserInfoClaims} from './userInfoClaims';

/*
 * API claims used for authorization
 */
export class ApiClaims {

    // The immutable user id from the access token, which may exist in the API's database
    public userId: string;

    // The calling application's client id can potentially be used for authorization
    public callingApplicationId: string;

    // OAuth scopes can represent high level areas of the business
    public scopes: string[];

    // Details from the Central User Data for given name, family name and email
    public userInfo: UserInfoClaims | null;

    // Product Specific data used for authorization
    public userCompanyIds: number[];

    /*
     * Initialize from token details we are interested in
     */
    public constructor(userId: string, callingApplicationId: string, scope: string) {
        this.userId = userId;
        this.callingApplicationId = callingApplicationId;
        this.scopes = scope.split(' ');
        this.userInfo = null;
        this.userCompanyIds = [];
    }

    /*
     * Set fields after receiving OAuth user info data
     */
    public setCentralUserData(givenName: string, familyName: string, email: string) {
        this.userInfo = new UserInfoClaims(givenName, familyName, email);
    }

    /*
     * Set a custom business rule
     */
    public setProductSpecificUserRights(userCompanyIds: number[]) {
        this.userCompanyIds = userCompanyIds;
    }
}
