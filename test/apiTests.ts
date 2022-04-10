import assert from 'assert';
import fs from 'fs-extra';
import {Guid} from 'guid-typescript';
import {LambdaChildProcess} from './utils/lambdaChildProcess';
import {TokenIssuer} from './utils/tokenIssuer';
import {WiremockAdmin} from './utils/wiremockAdmin';

/*
 * Test the API in isolation, without any dependencies on the Authorization Server
 */
describe('ApiTests', () => {

    // The real subject claim values for my two online test users
    const guestUserId  = 'a6b404b1-98af-41a2-8e7f-e4061dc0bf86';
    const guestAdminId = '77a97e5b-b748-45e5-bb6f-658e85b2df91';

    // A class to issue our own JWTs for testing
    const tokenIssuer = new TokenIssuer();
    const wiremockAdmin = new WiremockAdmin(false);

    // The test session ID
    const sessionId = Guid.create().toString();

    /*
     * Initialize the test configuration and token issuer, then register a mock keyset the API will use to validate JWTs
     */
    before( async () => {

        await fs.copy('environments/test.config.json', 'api.config.json');

        await tokenIssuer.initialize();
        const keyset = await tokenIssuer.getTokenSigningPublicKeys();

        await wiremockAdmin.initialize();
        await wiremockAdmin.registerJsonWebWeys(keyset);
    });

    /*
     * Restore the API's main configuration and clean up wiremock resources
     */
    after( async () => {
        await fs.copy('environments/api.config.json', 'api.config.json');
        await wiremockAdmin.unregisterJsonWebWeys();
        await wiremockAdmin.unregisterUserInfo();
    });

    /*
     * Test getting claims
     */
    it ('Get user claims returns a single region for the standard user', async () => {

        // Get an access token for the end user of this test
        const accessToken = await tokenIssuer.issueAccessToken(guestUserId);

        // Register the Authorization Server response
        const mockUserInfo = {
            given_name: 'Guest',
            family_name: 'User',
            email: 'guestuser@mycompany.com',
        };
        await wiremockAdmin.registerUserInfo(JSON.stringify(mockUserInfo));

        // Run the lambda function
        const options = {
            httpMethod: 'GET',
            apiPath: '/api/userinfo',
            lambdaFunction: 'getUserClaims',
            accessToken,
            sessionId,
        };
        const response = await LambdaChildProcess.invoke(options);

        // Assert results
        assert.strictEqual(response.statusCode, 200, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.regions.length, 1, 'Unexpected regions claim');

    }).timeout(10000);

    /*
     * Test getting claims for the admin user
     */
    it ('Get user claims returns all regions for the admin user', async () => {

        // Get an access token for the end user of this test
        const accessToken = await tokenIssuer.issueAccessToken(guestAdminId);

        // Register the Authorization Server response
        const mockUserInfo = {
            given_name: 'Admin',
            family_name: 'User',
            email: 'guestadmin@mycompany.com',
        };
        await wiremockAdmin.registerUserInfo(JSON.stringify(mockUserInfo));

        // Run the lambda function
        const options = {
            httpMethod: 'GET',
            apiPath: '/api/userinfo',
            lambdaFunction: 'getUserClaims',
            accessToken,
            sessionId,
        };
        const response = await LambdaChildProcess.invoke(options);

        // Assert results
        assert.strictEqual(response.statusCode, 200, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.regions.length, 3, 'Unexpected regions claim');

    }).timeout(10000);

    /*
     * Test getting companies
     */
    it ('Get companies list returns 2 items for the standard user', async () => {

        // Get an access token for the end user of this test
        const accessToken = await tokenIssuer.issueAccessToken(guestUserId);

        // Register the Authorization Server response
        const mockUserInfo = {
            given_name: 'Guest',
            family_name: 'User',
            email: 'guestuser@mycompany.com',
        };
        await wiremockAdmin.registerUserInfo(JSON.stringify(mockUserInfo));

        // Run the lambda function
        const options = {
            httpMethod: 'GET',
            apiPath: '/api/companies',
            lambdaFunction: 'getCompanyList',
            accessToken,
            sessionId,
        };
        const response = await LambdaChildProcess.invoke(options);

        // Assert results
        assert.strictEqual(response.statusCode, 200, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.length, 2, 'Unexpected companies list');

    }).timeout(10000);

    /*
     * Test getting companies
     */
    it ('Get companies list returns all items for the admin user', async () => {

        // Get an access token for the end user of this test
        const accessToken = await tokenIssuer.issueAccessToken(guestAdminId);

        // Register the Authorization Server response
        const mockUserInfo = {
            given_name: 'Admin',
            family_name: 'User',
            email: 'guestadmin@mycompany.com',
        };
        await wiremockAdmin.registerUserInfo(JSON.stringify(mockUserInfo));

        // Run the lambda function
        const options = {
            httpMethod: 'GET',
            apiPath: '/api/companies',
            lambdaFunction: 'getCompanyList',
            accessToken,
            sessionId,
        };
        const response = await LambdaChildProcess.invoke(options);

        // Assert results
        assert.strictEqual(response.statusCode, 200, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.length, 4, 'Unexpected companies list');

    }).timeout(10000);
});
