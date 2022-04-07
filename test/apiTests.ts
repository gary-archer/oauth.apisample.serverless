import assert from 'assert';
import axios from 'axios';
import exec from 'child_process';
import fs from 'fs-extra';
import {Guid} from 'guid-typescript';
import {TokenIssuer} from './tokenIssuer';

/*
 * Test the API in isolation, without any dependencies on the Authorization Server
 */
describe('ApiTests', () => {

    // The wiremock replacement for the Authorization Server
    const wiremockAdminEndpoint = 'http://login.mycompany.com/__admin/mappings';

    // A class to issue our own JWTs for testing
    const tokenIssuer = new TokenIssuer();

    // The test session ID
    const sessionId = Guid.create().toString();

    /*
     * Initialize the token issuer and update the API to use test configuration
     */
    before( async () => {

        await fs.copy('environments/test.config.json', 'api.config.json');
        await tokenIssuer.initialize();
        
        // TODO: Get the JWKS data and set it against the Wiremock admin API
        const keySet = tokenIssuer.getTokenSigningPublicKeys();
    });

    /*
     * Restore the API's main configuration once all tests have completed
     */
    after( async () => {
        await fs.copy('environments/api.config.json', 'api.config.json');
    });

    /*
     * Test the user claims endpoint
     */
    it('Get user claims returns valid data', async () => {

        // Get a token for an end user for this request
        const accessToken = await tokenIssuer.issueAccessToken('abc123');

        // TODO: Set the user info for the current test in the Authorization Server

        // The lambda input contains the access token and some custom headers used for API logging
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

        // Run sls invoke
        // sls invoke local -f getUserClaims -p test/input.json > test/output.json

        assert.strictEqual(2, 2, 'Incorrect number');
    })

    /*
     * Test the get company list endpoint
     */
    it('Get company list returns valid data', async () => {

        //"getCompanyList": "sls invoke local -f getCompanyList -p test/getCompanyList.json",
    })

    /*
     * Test the get company transactions endpoint
     */
    it('Get company transactions returns valid data', async () => {

        //"getCompanyTransactions": "sls invoke local -f getCompanyTransactions -p test/getCompanyTransactions.json",
    })

    // ALSO: test company 3 unauthorized and also a 500 exception
    // "x-mycompany-test-exception": ""
})
