'use strict';

const lbapi = require('../lb-api');
const credentials = require('../credential-providers');
const provider = new credentials.AWSProvider();
const apiUrl = process.env.LbApiUrl || 'https://lb-api-uat.ptgmis.com';
const client = new lbapi.Client(apiUrl, provider);

module.exports = new lbapi.ConsumerApi(client);