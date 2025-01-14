/*
 * Enable access token claims to be customized for developer tests
 */
export class MockTokenOptions {

    public issuer = 'https://login.authsamples-dev.com';

    public audience = 'api.authsamples.com';

    public scope = 'openid profile https://api.authsamples.com/investments';

    public role = '';

    public expiryTime = Date.now() + (15 * 60 * 1000);

    public subject = '';

    public managerId = '';

    /*
     * Test with the user identities for the standard user
     */
    public useStandardUser(): void {
        this.subject = '06e3c525-33d1-47ec-97be-03d8affc3726';
        this.managerId = '10345';
        this.role = 'user';
    }

    /*
     * Test with the user identities for the admin user
     */
    public useAdminUser(): void {
        this.subject = 'd3d64319-1f84-42bb-92cb-5883793c50dc';
        this.managerId = '20116';
        this.role = 'admin';
    }
}