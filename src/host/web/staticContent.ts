import {Context} from 'aws-lambda';
import {WebStaticContent} from './webStaticContent';

/*
 * This handler is a primitive web server that runs on a developer PC
 * It serves browser requests for web files and delivers static content as bytes
 */
const handler = async (event: any, context: Context) => {

    try {

        // Try to load the file
        const loader = new WebStaticContent();
        const [data, mimeType] = await loader.loadFile(event.path);

        // Return the web file as bytes
        return {
            statusCode: 200,
            headers: {
                'Content-Type': mimeType,
            },
            body: data,
        };
    } catch (e) {

        // Indicate not found if we could not read the web content
        // Most commonly this will occur if the parallel folder for the web sample has not been downloaded
        const error = {
            code: 'web_content_not_found',
            message: `Unable to serve web resource at ${event.path}`,
        };

        return {
            statusCode: 404,
            body: JSON.stringify(error),
        };
    }
};

// Export the handler to serverless.yml
export {handler};
