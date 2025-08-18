import {Disposable} from '../utilities/disposable.js';

/*
 * Represents a time measurement within an API operation
 */
export interface PerformanceBreakdown extends Disposable {

    // Set details to associate with the performance breakdown
    setDetails(value: any): void;

    // Create a child breakdown for an inner timing
    createChild(name: string): PerformanceBreakdown;
}
