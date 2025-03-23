import assert from 'assert';
import {randomUUID} from 'crypto';
import {generateKeyPair} from 'jose';
import {ApiClient} from './utils/apiClient.js';
import {ApiRequestOptions} from './utils/apiRequestOptions.js';
import {MockAuthorizationServer} from './utils/mockAuthorizationServer.js';
import {MockTokenOptions} from './utils/mockTokenOptions.js';

/*
 * Test the API in isolation, without any dependencies on real access tokens
 */
describe('OAuth API Tests', () => {

    const useProxy = false;
    const authorizationServer = new MockAuthorizationServer(useProxy);

    const apiBaseUrl = 'https://api.authsamples-dev.com:446';
    const sessionId = randomUUID();
    const apiClient = new ApiClient(apiBaseUrl, 'IntegrationTests', sessionId, useProxy);

    /*
     * Start a mock authorization server during tests
     */
    before( async () => {
        await authorizationServer.start();
    });

    /*
     * Free resources when all tests have completed
     */
    after( async () => {
        await authorizationServer.stop();
    });

    /*
     * Test that a request without an access token is rejected
     */
    it ('Call API returns 401 for missing JWT', async () => {

        // Call the API
        const options = new ApiRequestOptions('');
        const response = await apiClient.getCompanyList(options);

        // Assert results
        assert.strictEqual(response.statusCode, 401, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.code, 'invalid_token', 'Unexpected error code');
    });

    /*
     * Test that an expired access token is rejected
     */
    it ('Call API returns 401 for an expired JWT', async () => {

        // Get an access token for the end user of this test
        const jwtOptions = new MockTokenOptions();
        jwtOptions.useStandardUser();
        jwtOptions.expiryTime = Date.now() / 1000 - (60 * 1000);
        const accessToken = await authorizationServer.issueAccessToken(jwtOptions);

        // Call the API
        const options = new ApiRequestOptions(accessToken);
        const response = await apiClient.getCompanyList(options);

        // Assert results
        assert.strictEqual(response.statusCode, 401, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.code, 'invalid_token', 'Unexpected error code');
    });

    /*
     * Test that an access token with an invalid issuer is rejected
     */
    it ('Call API returns 401 for invalid issuer', async () => {

        // Set the access token values
        const jwtOptions = new MockTokenOptions();
        jwtOptions.useStandardUser();
        jwtOptions.issuer = 'https://otherissuer.com';
        const accessToken = await authorizationServer.issueAccessToken(jwtOptions);

        // Call the API
        const options = new ApiRequestOptions(accessToken);
        const response = await apiClient.getCompanyList(options);

        // Assert results
        assert.strictEqual(response.statusCode, 401, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.code, 'invalid_token', 'Unexpected error code');
    });

    /*
     * Test that an access token with an invalid audience is rejected
     */
    it ('Call API returns 401 for invalid audience', async () => {

        // Set the access token values
        const jwtOptions = new MockTokenOptions();
        jwtOptions.useStandardUser();
        jwtOptions.audience = 'api.other.com';
        const accessToken = await authorizationServer.issueAccessToken(jwtOptions);

        // Call the API
        const options = new ApiRequestOptions(accessToken);
        const response = await apiClient.getCompanyList(options);

        // Assert results
        assert.strictEqual(response.statusCode, 401, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.code, 'invalid_token', 'Unexpected error code');
    });

    /*
     * Test that an access token with an invalid signature is rejected
     */
    it ('Call API returns 401 for invalid signature', async () => {

        // Set the access token values
        const jwtOptions = new MockTokenOptions();
        jwtOptions.useStandardUser();
        const maliciousKeypair = await generateKeyPair('ES256');
        const accessToken = await authorizationServer.issueAccessToken(jwtOptions, maliciousKeypair);

        // Call the API
        const options = new ApiRequestOptions(accessToken);
        const response = await apiClient.getCompanyList(options);

        // Assert results
        assert.strictEqual(response.statusCode, 401, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.code, 'invalid_token', 'Unexpected error code');
    });

    /*
     * Test that an access token with an invalid scope is rejected
     */
    it ('Call API returns 403 for invalid scope', async () => {

        // Set the access token values
        const jwtOptions = new MockTokenOptions();
        jwtOptions.useStandardUser();
        jwtOptions.scope = 'openid profile';
        const accessToken = await authorizationServer.issueAccessToken(jwtOptions);

        // Call the API
        const options = new ApiRequestOptions(accessToken);
        const response = await apiClient.getCompanyList(options);

        // Assert results
        assert.strictEqual(response.statusCode, 403, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.code, 'insufficient_scope', 'Unexpected error code');
    });

    /*
     * Test rehearsing a 500 error when there is an exception in the API
     */
    it ('Call API returns supportable 500 error for error rehearsal request', async () => {

        // Set the access token values
        const jwtOptions = new MockTokenOptions();
        jwtOptions.useStandardUser();
        const accessToken = await authorizationServer.issueAccessToken(jwtOptions);

        // Call a valid API operation but pass a custom header to cause an API exception
        const options = new ApiRequestOptions(accessToken);
        options.setRehearseException(true);
        const response = await apiClient.getCompanyTransactions(options, 2);

        // Assert results
        assert.strictEqual(response.statusCode, 500, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.code, 'exception_simulation', 'Unexpected error code');
    });

    /*
     * Test getting business user attributes for the standard user
     */
    it ('Get user info returns a single region for the standard user', async () => {

        // Set the access token values
        const jwtOptions = new MockTokenOptions();
        jwtOptions.useStandardUser();
        const accessToken = await authorizationServer.issueAccessToken(jwtOptions);

        // Call the API
        const options = new ApiRequestOptions(accessToken);
        const response = await apiClient.getUserInfoClaims(options);

        // Assert results
        assert.strictEqual(response.statusCode, 200, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.regions.length, 1, 'Unexpected regions claim');
    });

    /*
     * Test getting business user attributes for the admin user
     */
    it ('Get user info returns all regions for the admin user', async () => {

        // Set the access token values
        const jwtOptions = new MockTokenOptions();
        jwtOptions.useAdminUser();
        const accessToken = await authorizationServer.issueAccessToken(jwtOptions);

        // Call the API
        const options = new ApiRequestOptions(accessToken);
        const response = await apiClient.getUserInfoClaims(options);

        // Assert results
        assert.strictEqual(response.statusCode, 200, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.regions.length, 3, 'Unexpected regions claim');
    });

    /*
     * Test getting companies for the standard user
     */
    it ('Get companies list returns 2 items for the standard user', async () => {

        // Set the access token values
        const jwtOptions = new MockTokenOptions();
        jwtOptions.useStandardUser();
        const accessToken = await authorizationServer.issueAccessToken(jwtOptions);

        // Call the API
        const options = new ApiRequestOptions(accessToken);
        const response = await apiClient.getCompanyList(options);

        // Assert results
        assert.strictEqual(response.statusCode, 200, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.length, 2, 'Unexpected companies list');
    });

    /*
     * Test getting companies for the admin user
     */
    it ('Get companies list returns all items for the admin user', async () => {

        // Set the access token values
        const jwtOptions = new MockTokenOptions();
        jwtOptions.useAdminUser();
        const accessToken = await authorizationServer.issueAccessToken(jwtOptions);

        // Call the API
        const options = new ApiRequestOptions(accessToken);
        const response = await apiClient.getCompanyList(options);

        // Assert results
        assert.strictEqual(response.statusCode, 200, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.length, 4, 'Unexpected companies list');
    });

    /*
     * Test getting allowed transactions
     */
    it ('Get transactions is allowed for companies that match the regions claim', async () => {

        // Set the access token values
        const jwtOptions = new MockTokenOptions();
        jwtOptions.useStandardUser();
        const accessToken = await authorizationServer.issueAccessToken(jwtOptions);

        // Call the API
        const options = new ApiRequestOptions(accessToken);
        const response = await apiClient.getCompanyTransactions(options, 2);

        // Assert results
        assert.strictEqual(response.statusCode, 200, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.transactions.length, 8, 'Unexpected transactions');
    });

    /*
     * Test getting unauthorized transactions
     */
    it ('Get transactions returns 404 for companies that do not match the regions claim', async () => {

        // Set the access token values
        const jwtOptions = new MockTokenOptions();
        jwtOptions.useStandardUser();
        const accessToken = await authorizationServer.issueAccessToken(jwtOptions);

        // Call the API
        const options = new ApiRequestOptions(accessToken);
        const response = await apiClient.getCompanyTransactions(options, 3);

        // Assert results
        assert.strictEqual(response.statusCode, 404, 'Unexpected HTTP status code');
        assert.strictEqual(response.body.code, 'company_not_found', 'Unexpected error code');
    });
});
