/*
 * Enable access token claims to be customized for developer tests
 */
export class MockTokenOptions {

    public issuer = 'https://login.authsamples-dev.com';

    public audience = 'api.authsamples.com';

    public scope = 'openid profile investments';

    public role = '';

    public expiryTime = Date.now() + (15 * 60 * 1000);

    public subject = '';

    public managerId = '';

    /*
     * Test with the user identities for the standard user
     */
    public useStandardUser(): void {
        this.subject = 'a6b404b1-98af-41a2-8e7f-e4061dc0bf86';
        this.managerId = '10345';
        this.role = 'user';
    }

    /*
     * Test with the user identities for the admin user
     */
    public useAdminUser(): void {
        this.subject = '77a97e5b-b748-45e5-bb6f-658e85b2df91';
        this.managerId = '20116';
        this.role = 'admin';
    }
}