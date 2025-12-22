import axios, {AxiosRequestConfig} from 'axios';
import {randomUUID} from 'crypto';
import {HttpProxy} from '../../src/plumbing/utilities/httpProxy.js';
import {ApiRequestOptions} from './apiRequestOptions.js';
import {ApiResponse} from './apiResponse.js';
import {ApiResponseMetrics} from './apiResponseMetrics.js';

/*
 * A utility class to call the API in a parameterized manner
 */
export class ApiClient {

    private readonly baseUrl: string;
    private readonly httpProxy: HttpProxy;

    public constructor(baseUrl: string, useProxy: boolean) {
        this.baseUrl = baseUrl;
        this.httpProxy = new HttpProxy(useProxy, 'http://127.0.0.1:8888');
    }

    public async getUserInfoClaims(options: ApiRequestOptions): Promise<ApiResponse> {

        options.setHttpMethod('GET');
        options.setApiPath('/investments/userinfo');

        const metrics = {
            operation: 'getUserInfoClaims',
        } as ApiResponseMetrics;

        return this.callApi(options, metrics);
    }

    public async getCompanyList(options: ApiRequestOptions): Promise<ApiResponse> {

        options.setHttpMethod('GET');
        options.setApiPath('/investments/companies');

        const metrics = {
            operation: 'getCompanyList',
        } as ApiResponseMetrics;

        return this.callApi(options, metrics);
    }

    public async getCompanyTransactions(options: ApiRequestOptions, companyId: number): Promise<ApiResponse> {

        options.setHttpMethod('GET');
        options.setApiPath(`/investments/companies/${companyId}/transactions`);

        const metrics = {
            operation: 'getCompanyTransactions',
        } as ApiResponseMetrics;

        return this.callApi(options, metrics);
    }

    private async callApi(requestOptions: ApiRequestOptions, metrics: ApiResponseMetrics): Promise<ApiResponse> {

        metrics.startTime = new Date();
        metrics.correlationId = randomUUID();
        const hrtimeStart = process.hrtime();

        const headers: any = {
            authorization: `Bearer ${requestOptions.getAccessToken()}`,
            'correlation-id': metrics.correlationId,
        };

        const options = {
            url: this.baseUrl + requestOptions.getApiPath(),
            method: requestOptions.getHttpMethod(),
            headers,
            httpsAgent: this.httpProxy.getAgent(),
        } as AxiosRequestConfig;

        if (requestOptions.getRehearseException()) {
            headers['api-exception-simulation'] = 'FinalApi';
        }

        try {

            const response = await axios(options);

            return {
                statusCode: response.status,
                body: response.data,
                metrics,
            };

        } catch (e: any) {

            if (e.response && e.response.status && e.response.data && typeof e.response.data === 'object') {

                // Return JSON error responses
                return {
                    statusCode: e.response.status,
                    body: e.response.data,
                    metrics,
                };

            } else {

                // Rethrow connectivity errors, which will stop the load test
                throw e;
            }
        } finally {

            // Report the time taken
            const hrtimeEnd = process.hrtime(hrtimeStart);
            metrics.millisecondsTaken = Math.floor((hrtimeEnd[0] * 1000000000 + hrtimeEnd[1]) / 1000000);
        }
    }
}
