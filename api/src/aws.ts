import * as express from 'express';
import * as serverlessHttp from 'serverless-http';
import {Companies} from './logic/Companies';

const expressApp = express();

expressApp.get('/companies', (req, res) => {
    const companies = new Companies();
    res.send(companies.GetCompanies());
});

expressApp.get('/companies/:id([0-9]+)/transactions', (req, res) => {
    res.send(`Transactions for company ${req.params.id}`);
  });

const handler = serverlessHttp(expressApp);
export {handler};
