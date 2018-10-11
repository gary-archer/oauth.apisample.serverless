'use strict';

const consumerApiHandling = require('./api-response-handling');
const consumerApiResponse = new consumerApiHandling();

module.exports = class {
    constructor (client) {
        this._client = client;
    }

    async createDummyBankCardMember(memberDetails) {
        const url = `/api/v1/registration/dummyBankCard`;
        return await request(this._client, 'POST', url,memberDetails);
    }

    async getConsumerProfile (productCode, consumerNumber, errorMapper) {
        const url = `/api/v1/member/consumer/${consumerNumber}/profile?productCode=${productCode}`;
        return await request(this._client, 'GET', url, null, errorMapper);
    }

    async getConsumerConfig (productCode, consumerNumber, errorMapper) {
      const url = `/api/v1/member/consumer/${consumerNumber}/config?productCode=${productCode}`;
      return await request(this._client, 'GET', url, null, errorMapper);
    }

    async lookupMembershipNumber (memershipNumber, errorMapper) {
        const url = `/api/v1/member/${memershipNumber}/lookup`;
        return await request(this._client, 'GET', url, null, errorMapper);
    }

    async updatePersonalDetails(consumerNumber, personalDetails, errorMapper) {
        const url = `/api/v1/member/consumer/${consumerNumber}/personalDetails`;
        return await request(this._client, 'PUT', url, personalDetails, errorMapper);
    }

    async updateDeliveryAddress(consumerNumber, addressDetails, errorMapper) {
        const url = `/api/v1/member/consumer/${consumerNumber}/address/DELIVERY`;
        return await request(this._client, 'PUT', url, addressDetails, errorMapper);
    }

    async postVisits(consumerNumber, visitDetails, errorMapper) {
        const url = `/api/v1/member/consumer/${consumerNumber}/visits`;
        return await request(this._client, 'POST', url, visitDetails, errorMapper);
    }

    async getStatus(errorMapper) {
        const url = `/api/v1/maintenance/ping`;
        return await request(this._client, 'GET', url, undefined, errorMapper, false);
    }
}

const request = async function(client, verb, url, body, errorMapper, authenticateRequest = true) {
    try {
        let response = await client.request(verb, url, body, true, authenticateRequest);
        return consumerApiResponse.handleResponse(response);
    } catch(error) {
        return consumerApiResponse.handleError(error, url, errorMapper);
    }
}