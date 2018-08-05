/*
 * Serverless expects this file to be in the root folder
 */
import {Context} from 'aws-lambda';
import {Companies} from './src/Companies';

/*
 * The handler logic
 */
class RequestHandler {

    public static async HandleRequest(event: any, context: Context): Promise<any> {

        const companies = new Companies();
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                message: 'API called successfully: ' + companies.GetCompanies(),
            }),
        };

        return response;
    }
}

// Export the handler which is referenced in the serverless.yml file
const handler = RequestHandler.HandleRequest;
export {handler};
