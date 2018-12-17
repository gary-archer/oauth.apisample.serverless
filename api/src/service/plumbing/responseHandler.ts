import {Context} from 'aws-lambda';

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
     * Return a 4xx error to the caller
     */
    public static validationErrorResponse(statusCode: number, error: any, context: any): any {

        // Get the error object to return from the lambda
        const response = ResponseHandler.objectResponse(statusCode, error);

        // Get the error object to return from the API gateway
        // The errorResponse property is double serialized against the context
        // The DEFAULT_4XX error properties in Serverless.yml reference this object
        context.errorResponse = JSON.stringify(response.body);
        return response;
    }

    /*
     * Return a 5xx error to the caller
     */
    public static exceptionErrorResponse(statusCode: number, error: any, context: any): any {

        // Get the error object to return from the lambda
        const response = ResponseHandler.objectResponse(statusCode, error);

        // Get the error object to return from the API gateway
        // The errorResponse property is double serialized against the context
        // The DEFAULT_5XX error properties in Serverless.yml reference this object
        context.errorResponse = JSON.stringify(response.body);
        return response;
    }
}
