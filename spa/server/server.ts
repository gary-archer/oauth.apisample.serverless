import * as express from 'express';
import * as fs from 'fs-extra';
import * as https from 'https';
import {WebServer} from './webServer';

 /*
  * A simple web server for hosting our SPA during local development
  */
const expressApp = express();

/*
 * Configure the web server
 */
const webServer = new WebServer(expressApp);
webServer.configureRoutes();

// SSL details
const port = 443;
const sslCertificateFileName = 'server/certs/mycompany.ssl.pfx';
const sslCertificatePassword = 'SslPassword1';

// Load the certificate file from disk
const sslOptions = {
    pfx: fs.readFileSync(sslCertificateFileName),
    passphrase: sslCertificatePassword,
};

// Start listening on HTTPS
const httpsServer = https.createServer(sslOptions, expressApp);
httpsServer.listen(port, () => {
    console.log(`Server is listening on HTTPS port ${port}`);
});
