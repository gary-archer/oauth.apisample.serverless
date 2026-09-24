import {after, before, describe, it} from 'mocha';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {ApiClient} from './utils/apiClient.js';
import {ApiRequestOptions} from './utils/apiRequestOptions.js';
import {ApiResponse} from './utils/apiResponse.js';
import {MockAuthorizationServer} from './utils/mockAuthorizationServer.js';
import {MockTokenOptions} from './utils/mockTokenOptions.js';

/*
 * A load test to ensure that the API can safely be called concurrently
 */
describe('Load Test', () => {

    // Use an HTTP proxy if required
    const useProxy = false;

    // Create the mock authorization server
    const authorizationServer = new MockAuthorizationServer(useProxy);

    // Create the API client
    const apiBaseUrl = 'https://api.authsamples-dev.com:446';
    const apiClient = new ApiClient(apiBaseUrl, useProxy);

    // Create a delegation ID to represent the load test session
    const delegationId = randomUUID();

    // Initialize counts
    const numApiRequests = 100;
    let totalCount = 0;
    let errorCount = 0;

    // Set colours
    const colorBlue = '\u001B[34m';
    const colorGreen = '\u001B[32m';
    const colorRed = '\u001B[31m';
    const colorYellow = '\u001B[33m';

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

    it ('Makes a volume of requests with the expected error count', async () => {

        // Get some access tokens to send to the API
        const startMessage = `Load test session ${delegationId} starting at ${new Date().toISOString()}\n`;
        outputMessage(colorBlue, startMessage);
        const accessTokens = await getAccessTokens();

        // Show a startup table header
        const startTime = process.hrtime();
        const headings = [
            'OPERATION'.padEnd(25),
            'CORRELATION-ID'.padEnd(38),
            'START-TIME'.padEnd(28),
            'MILLISECONDS-TAKEN'.padEnd(21),
            'STATUS-CODE'.padEnd(14),
            'ERROR-CODE'.padEnd(24),
            'ERROR-ID'.padEnd(12),
        ];
        const header = headings.join('');
        outputMessage(colorYellow, header);

        // Next execute the main body of requests
        await sendLoadTestRequests(accessTokens);

        // Report a summary of results
        const endTime = process.hrtime(startTime);
        const millisecondsTaken = Math.floor((endTime[0] * 1000000000 + endTime[1]) / 1000000);
        const endMessage = `Load test session ${delegationId} completed in ${millisecondsTaken} milliseconds`;
        const errorStats = `${errorCount} errors from ${totalCount} requests`;
        outputMessage(colorBlue, `\n${endMessage}: (${errorStats})`);

        // Assert expected results
        assert.strictEqual(totalCount, numApiRequests);
        assert.strictEqual(errorCount, 3);

    }).timeout(60 * 1000);

    /*
     * Do some initial work to get multiple access tokens
     */
    async function getAccessTokens(): Promise<string[]> {

        const accessTokens: string[] = [];
        for (let index = 0; index < 5; index++) {

            const jwtOptions = new MockTokenOptions();
            jwtOptions.useStandardUser();
            jwtOptions.delegationId = delegationId;
            const accessToken = await authorizationServer.issueAccessToken(jwtOptions);
            accessTokens.push(accessToken);
        }

        // Return access tokens for later API requests, which will run faster
        return accessTokens;
    }

    /*
     * Run the main body of API requests, including some invalid requests that trigger errors
     */
    async function sendLoadTestRequests(accessTokens: string[]): Promise<void> {

        // Next produce some requests that will run in parallel
        const requests: (() => Promise<ApiResponse>)[] = [];
        for (let index = 0; index < numApiRequests; index++) {

            // Create a 401 error on request 10, by making the access token act expired
            let accessToken = accessTokens[index % 5];
            if (index === 10) {
                accessToken += 'x';
            }

            // Create some promises for various API endpoints
            if (index % 5 === 0) {

                requests.push(createUserInfoRequest(accessToken));

            } else if (index % 5 === 1) {

                requests.push(createTransactionsRequest(accessToken, 2));

            } else if (index % 5 === 2) {

                // On request 71 try to access unauthorized data for company 3, to create a 404 error
                const companyId = (index === 72) ? 3 : 2;
                requests.push(createTransactionsRequest(accessToken, companyId));

            } else {

                requests.push(createCompaniesRequest(accessToken));
            }
        }

        // Fire the API requests in batches
        await executeApiRequests(requests);
    }

    /*
     * Create a user info request callback
     */
    function createUserInfoRequest(accessToken: string): () => Promise<ApiResponse> {

        const options = new ApiRequestOptions(accessToken);
        initializeApiRequest(options);
        return () => apiClient.getUserInfoClaims(options);
    }

    /*
     * Create a get companies request callback
     */
    function createCompaniesRequest(accessToken: string): () => Promise<ApiResponse> {

        const options = new ApiRequestOptions(accessToken);
        initializeApiRequest(options);
        return () => apiClient.getCompanyList(options);
    }

    /*
     * Create a get transactions request callback
     */
    function createTransactionsRequest(accessToken: string, companyId: number): () => Promise<ApiResponse> {

        const options = new ApiRequestOptions(accessToken);
        initializeApiRequest(options);
        return () => apiClient.getCompanyTransactions(options, companyId);
    }

    /*
     * Set any special logic before sending an API request
     */
    function initializeApiRequest(options: ApiRequestOptions): void {

        // On request 85 we'll simulate a 500 error via a custom header
        totalCount++;
        if (totalCount === 85) {
            options.setRehearseException(true);
        }
    }

    /*
     * Issue API requests in batches of 5, to avoid excessive queueing on a development computer
     * By default there is a limit of 5 concurrent outgoing requests to a single host
     */
    async function executeApiRequests(requests: (() => Promise<ApiResponse>)[]): Promise<void> {

        // Set counters
        const total = requests.length;
        const batchSize = 5;
        let current = 0;

        // Process one batch at a time
        while (current < total) {

            // Get a batch of requests
            const requestBatch = requests.slice(current, Math.min(current + batchSize, total));

            // Execute them to create promises
            const batchPromises = requestBatch.map((r) => executeApiRequest(r));

            // Wait for the batch to complete
            await Promise.all(batchPromises);
            current += batchSize;
        }
    }

    /*
     * Start execution and return a success promise regardless of whether the API call succeeded
     */
    async function executeApiRequest(callback: () => Promise<ApiResponse>): Promise<ApiResponse> {

        return new Promise<ApiResponse>((resolve) => {

            // Call 'then' to start firing the API request without waiting
            callback().then((response) => {

                if (response.statusCode >= 200 && response.statusCode <= 299) {

                    // Report successful requests
                    outputMessage(colorGreen, processMetrics(response));

                } else {

                    // Report failed requests, some of which are expected
                    outputMessage(colorRed, processMetrics(response));
                    errorCount++;
                }

                // Resolve the promise
                resolve(response);
            });
        });
    }

    /*
     * Process metrics and return a table row
     */
    function processMetrics(response: ApiResponse): string {

        let errorCode = '';
        let errorId   = '';

        if (response.statusCode >= 400 && response.body.code) {
            errorCode = response.body.code;
        }

        if (response.statusCode >= 500 && response.body.id) {
            errorId = response.body.id.toString();
        }

        const values = [
            response.metrics.operation.padEnd(25),
            response.metrics.correlationId.padEnd(38),
            response.metrics.startTime.toISOString().padEnd(28),
            response.metrics.millisecondsTaken.toString().padEnd(21),
            response.statusCode.toString().padEnd(14),
            errorCode.padEnd(24),
            errorId.padEnd(12),
        ];
        return values.join('');
    }

    /*
     * Output a message in colour
     */
    function outputMessage(colorCode: string, message: string): void {
        console.log(`${colorCode}${message}`);
    }
});
