/*
 * Some options suitable for our lambda API tests
 */
export interface LambdaChildProcessOptions {
    httpMethod: string;
    apiPath: string;
    lambdaFunction: string;
    accessToken: string;
    sessionId: string;
    pathParameters?: any;
    rehearseException?: boolean;
}
