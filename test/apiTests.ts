import assert from 'assert';
import fs from 'fs-extra';
import {Guid} from 'guid-typescript';
import {ChildProcess} from './childProcess';
import {TokenIssuer} from './tokenIssuer';
import {WiremockAdmin} from './wiremockAdmin';

/*
 * Test the API in isolation, without any dependencies on the Authorization Server
 */
describe('ApiTests', () => {

    // The real subject claim values for my two online test users
    const guestUserId  = 'a6b404b1-98af-41a2-8e7f-e4061dc0bf86';
    const guestAdminId = 'a6b404b1-98af-41a2-8e7f-e4061dc0bf86';

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
     * Test the user claims endpoint
     */
    it ('Get user claims returns standard region claims for the guest user', async () => {

        // Get an access token for the end user of this test
        const accessToken = await tokenIssuer.issueAccessToken(guestUserId);

        // Register the Authorization Server response
        const mockUserInfo = {
            given_name: 'Guest',
            family_name: 'User',
            email: 'guestuser@mycompany.com',
        };
        await wiremockAdmin.registerUserInfo(JSON.stringify(mockUserInfo));

        // Create the lambda function's request, including the access token and some custom headers for API logging
        const lambdaInput = {
            httpMethod: 'GET',
            path: '/api/companies',
            headers: {
                authorization: `Bearer ${accessToken}`,
                'x-mycompany-api-client': 'ServerlessTest',
                'x-mycompany-session-id': sessionId,
            },
        };
        fs.writeFile('test/input.json', JSON.stringify(lambdaInput, null, 2));

        // Run the Serverless API operation
        const rawResponse = await ChildProcess.run(
            'sls',
            ['invoke', 'local', '-f', 'getUserClaims', '-p', 'test/input.json']);

        // Assert results
        const response = JSON.parse(rawResponse);
        assert.strictEqual(response.statusCode, 200, rawResponse);
        assert.strictEqual(response.body.regions.length, 2, 'The regions claim did not contain the expected number of elements');

    }).timeout(10000);
});
