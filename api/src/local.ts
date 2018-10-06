/*
 * The entry point when running on a local developer PC
 */
import * as express from 'express';
import * as fs from 'fs-extra';
import {Configuration} from './configuration/configuration';
import {LocalHttpServer} from './localHttpServer';
import {WebApi} from './logic/webApi';

/*
 * First load configuration
 */
const apiConfigText = fs.readFileSync('api.config.json');
const apiConfig = JSON.parse(apiConfigText) as Configuration;

/*
 * Create the express app
 */
const expressApp = express();

/*
 * Configure the API
 */
const webApi = new WebApi(expressApp, apiConfig);
webApi.configureRoutes();

/*
 * Start listening for requests
 */
const httpServer = new LocalHttpServer(expressApp, apiConfig);
httpServer.startListening();
