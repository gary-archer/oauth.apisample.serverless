import {injectable} from 'inversify';

/*
 * Claims containg user details
 */
@injectable()
export class UserInfoClaims {

    private _givenName: string;
    private _familyName: string;
    private _email: string;

    public static importData(data: any): UserInfoClaims {
        return new UserInfoClaims(data.givenName, data.familyName, data.email);
    }

    public constructor(givenName: string, familyName: string, email: string) {
        this._givenName = givenName;
        this._familyName = familyName;
        this._email = email;
    }

    public get givenName(): string {
        return this._givenName;
    }

    public get familyName(): string {
        return this._familyName;
    }

    public get email(): string {
        return this._email;
    }

    public exportData(): any {

        return {
            'givenName': this._givenName,
            'familyName': this._familyName,
            'email': this._email,
        };
    }
}
