/*
 * Some metrics once an API call completes
 */
export interface ApiResponseMetrics {
    operation: string;
    startTime: Date;
    correlationId: string;
    millisecondsTaken: number;
}
