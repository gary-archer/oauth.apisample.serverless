import * as express from 'express';
import * as fs from 'fs-extra';
import * as https from 'https';
import * as url from 'url';
import {WebServer} from './webServer';

// Configure the web server
const expressApp = express();
const webServer = new WebServer(expressApp);
webServer.configureRoutes();

// Read the config file
const configBuffer = fs.readFileSync('./spa.config.json');
const config = JSON.parse(configBuffer.toString());

// Use the web URL to determine the port
const webUrl = url.parse(config.oauth.appUri);
let port: number = 0;
if (webUrl.port) {
    port = Number(webUrl.port);
}

// Serve local web content
if (webUrl.protocol === 'http:') {

    // The simple option is to use port 80
    port = (port === 0 ? 80 : port);
    expressApp.listen(port, () => {
        console.log(`Server is listening on HTTP port ${port}`);
    });

} else {

    // SSL details
    const sslCertificateFileName = 'server/certs/mycompany.ssl.pfx';
    const sslCertificatePassword = 'SslPassword1';

    // Load the certificate file from disk
    const sslOptions = {
        pfx: fs.readFileSync(sslCertificateFileName),
        passphrase: sslCertificatePassword,
    };

    // Start listening on HTTPS
    const httpsServer = https.createServer(sslOptions, expressApp);
    port = (port === 0 ? 443 : port);
    httpsServer.listen(port, () => {
        console.log(`Server is listening on HTTPS port ${port}`);
    });
}
