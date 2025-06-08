import {PerformanceBreakdown} from './performanceBreakdown.js';

/*
 * Each API request writes a structured log entry containing fields we will query by
 * These operations are exported and this interface can be injected into business logic
 */
export interface LogEntry {

    // Create a performance breakdown for business logic
    createPerformanceBreakdown(name: string): PerformanceBreakdown;

    // Add text logging from business logic (not recommended)
    addInfo(info: any): void;
}
