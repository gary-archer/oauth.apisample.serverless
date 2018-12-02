import * as Oidc from 'oidc-client';

/*
 * A class to work around areas where Cognito lacks standards support
 */
export class CognitoUserManager extends Oidc.UserManager {

    public constructor(settings: Oidc.UserManagerSettings) {
        super(settings);
    }

    // Start a login redirect in a non standard manner to work around Cognito limitations
    // Cognito actually returns an id token but requires us to send 'token', which is not correct
    // The important thing is that we receive an id token and validate it
    public async createSigninRequest(args?: any): Promise<Oidc.SigninRequest> {

        const request = await super.createSigninRequest(args);
        request.url = request.url.replace('token%20id_token', 'token');
        return request;
    }
}
