/*
 * A utility to write REST responses from objects and deal with common aspects
 */
export class ResponseWriter {

    /*
     * Return data to the caller, which could be a success or error object
     */
    public static objectResponse(statusCode: number, data: any): any {

        return {
            statusCode,
            body: JSON.stringify(data),
        };
    }
}
