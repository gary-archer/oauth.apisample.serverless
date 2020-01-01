import fs from 'fs-extra';
import path from 'path';

/*
 * The relative path to web files
 */
const WEB_FILES_ROOT = '../../../../authguidance.websample.final/spa';

/*
 * For demo purposes our API also hosts some web static content
 */
export class DevlopmentStaticContentLoader {

    /*
     * Load the requested file, returning its bytes and mime type
     */
    public async loadFile(inputPath: string): Promise<[string, string]> {

        // Sanitise input
        const requestPath = inputPath.toLowerCase();
        const isConfigRequest = requestPath.indexOf('spa.config.json') !== -1;

        // Read the file bytes
        let data: string;
        if (!isConfigRequest) {

            // Read the file normally
            data = await this._readFile(requestPath);

        } else {

            // Special handling when serving the SPA configuration file
            data = await this._readSpaConfigFile(requestPath);
        }

        // Also calculate the mime type
        const mimeType = this._getMimeType(requestPath);

        // Return the result
        return [data, mimeType];
    }

    /*
     * Read the requested file's bytes from the web sample folder or return index.html if not found
     */
    private async _readFile(requestPath: string): Promise<string> {

        const resourcePath = requestPath.replace('/spa', '');
        let physicalPath = path.join(`${__dirname}/${WEB_FILES_ROOT}/${resourcePath}`);

        if (!await this._isFile(physicalPath)) {
            physicalPath = path.join(`${__dirname}/${WEB_FILES_ROOT}/index.html`);
        }

        const bytes = await fs.readFile(physicalPath);
        return bytes.toString();
    }

    /*
     * Special handling for the SPA configuration file, where we need to do some dynamic updates
     */
    private async _readSpaConfigFile(requestPath: string): Promise<string> {

        // Load the SPA configuration which points to Cognito and uses cloud UI and API URLs
        const data = await this._readFile(requestPath);

        // Update URLs to point to the developer local PC
        const config = JSON.parse(data);
        config.app.apiBaseUrl = 'https://api.mycompany.com/api';
        config.oauth.appUri = 'https://web.mycompany.com/spa/';
        return JSON.stringify(config);
    }

    /*
     * Return true if the file is found on disk
     */
    private async _isFile(physicalPath: string): Promise<boolean> {

        return new Promise((resolve, reject) => {

            fs.stat(physicalPath, (error, file) => {
                if (!error && file.isFile()) {
                    return resolve(true);
                }

                return resolve(false);
            });
          });
    }

    /*
     * Calculate the mime type based on the file extension
     */
    private _getMimeType(requestPath: string): string {

        const extension = path.extname(requestPath);
        switch (extension) {
            case '.js':
                return 'application/javascript';

            case '.css':
                return 'text/css';

            case '.svg':
                return 'image/svg+xml';

            case '.ico':
                return 'image/svg+xml';

            case '.json':
                return 'application/json';
        }

        return 'text/html';
    }
}
