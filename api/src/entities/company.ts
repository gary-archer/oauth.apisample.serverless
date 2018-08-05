/*
 * A simple startup company entity
 */
export interface Company {
    id: number;
    name: string;
    description: string;
    targetUsd: number;
    investmentUsd: number;
    noInvestors: number;
}
