import {IdentityLogData} from './identityLogData.js';
import {PerformanceBreakdown} from './performanceBreakdown.js';

/*
 * A log entry collects data during an API request and outputs it at the end
 */
export interface LogEntry {

    // Create a performance breakdown
    createPerformanceBreakdown(name: string): PerformanceBreakdown;

    // Add identity data
    setIdentity(data: IdentityLogData): void;

    // Add text logging
    addInfo(info: any): void;
}
