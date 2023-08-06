/*
 * Some options suitable for our lambda API tests
 */
export interface LambdaChildProcessOptions {
    httpMethod: string;
    apiPath: string;
    lambdaFunction: string;
    sessionId: string;
    accessToken: string;
    pathParameters?: any;
    rehearseException?: boolean;
}
