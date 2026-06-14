import {randomUUID} from 'crypto';
import {ApiRequestOptions} from './apiRequestOptions.js';
import {ApiResponse} from './apiResponse.js';
import {ApiResponseMetrics} from './apiResponseMetrics.js';

/*
 * A utility class to call the API in a parameterized manner
 */
export class ApiClient {

    private readonly baseUrl: string;

    public constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
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

        const headers: HeadersInit = {
            authorization: `Bearer ${requestOptions.getAccessToken()}`,
            'correlation-id': metrics.correlationId,
        };

        const url = this.baseUrl + requestOptions.getApiPath();
        const options: RequestInit = {
            method: requestOptions.getHttpMethod(),
            headers,
        };

        if (requestOptions.getRehearseException()) {
            headers['api-exception-simulation'] = 'FinalApi';
        }

        try {

            const response = await fetch(url, options);
            if (response.ok) {

                const responseData = await response.json();
                return {
                    statusCode: response.status,
                    body: responseData,
                    metrics,
                };

            } else {

                const errorData = await response.json();
                return {
                    statusCode: response.status,
                    body: errorData,
                    metrics,
                };

            }

        } finally {

            const hrtimeEnd = process.hrtime(hrtimeStart);
            metrics.millisecondsTaken = Math.floor((hrtimeEnd[0] * 1000000000 + hrtimeEnd[1]) / 1000000);
        }
    }
}
