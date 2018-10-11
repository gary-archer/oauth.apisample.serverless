'use strict';

const Operation = require('./lib/operation');
const Logger = require('./lib/logging');

module.exports = class extends Operation {
  constructor(consumerApi) {
    super();
    this._consumerApi = consumerApi;
  }

  async process(requestPath, apigeeCorrelationId) {
    const lbApiStatusResponse = await this._consumerApi.getStatus();

    const response = this.generateResponse(requestPath, apigeeCorrelationId, lbApiStatusResponse);

    if (response.statusCode != 200) {
      return this.failedDependencyResponse(response);
    }
    return this.okResponse(response);
  }

  generateResponse(requestPath, correlationId, lbApiStatusResponse) {
    const response = {};
    if (lbApiStatusResponse.statusCode != 200) {
      response.statusCode = 424;
    }
    else {
      response.statusCode = 200;
    }

    const lbApiStatusDependency = {
      "ResourceType": 'LB API',
      "Uri": "GET /api/v1/maintenance/ping",
      "Status": lbApiStatusResponse.statusCode
    };

    const errorMessage = lbApiStatusResponse.data && lbApiStatusResponse.data.Message;
    if (errorMessage) {
      lbApiStatusDependency.Error = errorMessage;
    }

    if (correlationId) {
      lbApiStatusDependency.CorrelationId = correlationId;
    }

    response.data = {
      "Description": "Member status",
      "ResourceType": "Apigee",
      "Uri": "GET " + requestPath,
      "Dependencies": [lbApiStatusDependency]
    };

    return response;
  }
}