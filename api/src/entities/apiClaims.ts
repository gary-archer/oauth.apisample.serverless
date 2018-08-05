import {UserInfoClaims} from './userInfoClaims';

/*
 * API claims used for authorization
 */
export class ApiClaims {

    // The user id from the access token
    public userId: string;

    // We can authorize based on the calling application's identity if required
    public callingApplicationId: string;

    // OAuth scopes are an array of strings
    public scopes: string[];

    // Central User Data is set after it is looked up
    public userInfo: UserInfoClaims | null;

    // Product Specific User Data is set after it is looked up
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
    public setCentralUserData(response: any) {
        this.userInfo = new UserInfoClaims(response.given_name, response.family_name, response.email);
    }

    /*
     * Set a custom business rule
     */
    public setProductSpecificUserRights(userCompanyIds: number[]) {
        this.userCompanyIds = userCompanyIds;
    }
}
