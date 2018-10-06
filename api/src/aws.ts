/*
 * The entry point when running in AWS
 */
import * as express from 'express';
import * as fs from 'fs-extra';
import * as serverlessHttp from 'serverless-http';
import {Configuration} from './configuration/configuration';
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
 * Configure the AWS integration
 */
const handler = serverlessHttp(expressApp);
export {handler};
