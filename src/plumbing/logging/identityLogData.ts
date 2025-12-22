/*
 * Identity data to log
 */
export interface IdentityLogData {

    // A stable anonymous identifier for the user
    userId: string;

    // The delegation ID
    delegationId: string;

    // The client ID or name
    clientId: string;

    // The scope to audit
    scope: string;

    // Claims to audit
    claims: any;
}
