import fs from 'fs-extra';
import path from 'path';

/*
 * Relative paths to web content, from other code samples in parallel folders to this one
 */
const WEB_FILES_ROOT = '../../../../authguidance.websample.final/spa';
const DESKTOP_FILES_ROOT = '../../../../authguidance.desktopsample1/web';
const MOBILE_FILES_ROOT = '../../../../authguidance.mobilesample.android/web';

/*
 * For demo purposes our API also hosts some web static content
 */
export class WebStaticContent {

    /*
     * Load the requested file, returning its bytes and mime type
     */
    public async loadFile(inputPath: string): Promise<[string, string]> {

        if (inputPath.startsWith('/desktop')) {

            // Our first desktop sample loads customised post login web content in the system browser
            return await this._loadDesktopFile(inputPath);

        } else if (inputPath.startsWith('/mobile')) {

            // Our Android sample uses custom web content to avoid Chrome Custom Tab hangs
            return await this._loadAndroidFile(inputPath);

        } else {

            // By default serve our SPA
            return await this._loadWebFile(inputPath);
        }
    }

    /*
     * Load content for our SPA
     */
    private async _loadWebFile(inputPath: string): Promise<[string, string]> {

        // Sanitise input
        const requestPath = inputPath.toLowerCase();
        const isConfigRequest = requestPath.indexOf('spa.config.json') !== -1;

        // Read the file bytes
        let data: string;
        if (!isConfigRequest) {

            // Read the file normally
            data = await this._readSpaFile(requestPath);

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
     * Load web content for our desktop app
     */
    private async _loadDesktopFile(inputPath: string): Promise<[string, string]> {

        const requestPath = inputPath.toLowerCase();
        const data = await this._readDesktopFile(requestPath);
        const mimeType = this._getMimeType(requestPath);
        return [data, mimeType];
    }

    /*
     * Load web content for our Android app
     */
    private async _loadAndroidFile(inputPath: string): Promise<[string, string]> {

        const requestPath = inputPath.toLowerCase();
        const data = await this._readAndroidFile(requestPath);
        const mimeType = this._getMimeType(requestPath);
        return [data, mimeType];
    }

    /*
     * Special handling for the SPA configuration file, where we need to do some dynamic updates
     */
    private async _readSpaConfigFile(requestPath: string): Promise<string> {

        // Load the SPA configuration which points to Cognito and uses cloud UI and API URLs
        const data = await this._readSpaFile(requestPath);

        // Update URLs to point to the developer local PC
        const config = JSON.parse(data);
        config.app.apiBaseUrl = 'https://api.mycompany.com/api';
        config.oauth.appUri = 'https://web.mycompany.com/spa/';
        return JSON.stringify(config);
    }

    /*
     * Read the web file's bytes from the web sample folder or return index.html if not found
     */
    private async _readSpaFile(requestPath: string): Promise<string> {

        const resourcePath = requestPath.replace('/spa', '');
        let physicalPath = path.join(`${__dirname}/${WEB_FILES_ROOT}/${resourcePath}`);

        if (!await this._isFile(physicalPath)) {
            physicalPath = path.join(`${__dirname}/${WEB_FILES_ROOT}/index.html`);
        }

        const bytes = await fs.readFile(physicalPath);
        return bytes.toString();
    }

    /*
     * Read the desktop file's bytes from the desktop sample folder
     */
    private async _readDesktopFile(requestPath: string): Promise<string> {

        const resourcePath = requestPath.replace('/desktop', '');
        const physicalPath = path.join(`${__dirname}/${DESKTOP_FILES_ROOT}/${resourcePath}`);
        const bytes = await fs.readFile(physicalPath);
        return bytes.toString();
    }

    /*
     * Read the Android file's bytes from the desktop sample folder
     */
    private async _readAndroidFile(requestPath: string): Promise<string> {

        const resourcePath = requestPath.replace('/mobile', '');
        const physicalPath = path.join(`${__dirname}/${MOBILE_FILES_ROOT}/${resourcePath}`);
        const bytes = await fs.readFile(physicalPath);
        return bytes.toString();
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
