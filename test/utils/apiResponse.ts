import {ApiResponseMetrics} from './apiResponseMetrics';

/*
 * Model a test API response as both data and metrics
 */
export interface ApiResponse {
    statusCode: number;
    body: any;
    metrics: ApiResponseMetrics;
}
