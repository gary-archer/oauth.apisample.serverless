/*
 * Special handling for Serverless Offline authorizer errors
 * We want to override the default handling of returning 403 for expired tokens
 */
export class ServerlessOfflineUnauthorizedError extends Error {

    /*
     * Serverless Offline only returns a 401 if we let an exception escape
     */
    public static throwIfRequired(event: any, statusCode: number) {
        if (statusCode === 401) {
            if (event && event.requestContext && event.requestContext.stage === 'local') {
                throw new ServerlessOfflineUnauthorizedError();
            }
        }
    }

    /*
     * This condition prevents the error being handled in our unexpected exception handler
     */
    public static catch(error: any): boolean {
        return error instanceof ServerlessOfflineUnauthorizedError;
    }
}
