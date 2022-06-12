/*
 * A holder for AWS cache configuration settings
 */
export interface CacheConfiguration {
    region: string;
    tableName: string;
    claimsCacheTimeToLiveMinutes: number;
    isActive: boolean;
}
