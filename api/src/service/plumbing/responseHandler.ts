/*
 * Helper methods to return responses
 */
export class ResponseHandler {

    /*
     * Return data to the caller, which could be a success or error object
     */
    public static objectResponse(statusCode: number, data: any): any {

        return {
            statusCode,
            body: JSON.stringify(data),
        };
    }

    /*
     * Return a 4xx error to the caller from our controller
     */
    public static validationErrorResponse(statusCode: number, error: any, context: any): any {

        // Set the error object to return from the lambda
        const response = ResponseHandler.objectResponse(statusCode, error);

        // Set the context error object to return from the API gateway
        // The DEFAULT_4XX properties in Serverless.yml reference this object
        context.errorResponse = response.body;

        // Return the lambda response
        return response;
    }

    /*
     * Return a 5xx error to the caller from our exception middleware
     */
    public static exceptionErrorResponse(statusCode: number, error: any, context: any): any {

        // Set the error object to return from the lambda
        const response = ResponseHandler.objectResponse(statusCode, error);

        // Set the context error object to return from the API gateway
        // The DEFAULT_5XX properties in Serverless.yml reference this object
        context.errorResponse = JSON.stringify(response.body);

        // Return the lambda response
        return response;
    }
}
