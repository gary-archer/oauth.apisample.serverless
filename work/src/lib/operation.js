'use strict';

module.exports = class {
  constructor() {

  }

  okResponse({ statusCode = 200, headers = null, data = null } = {}) {
    return {
      statusCode,
      headers,
      data
    };
  }

  createdResponse({ statusCode = 201, data = null } = {}) {
    return {
      statusCode,
      data
    };
  }

  notFoundResponse({ statusCode = 404, errorCode = 'not_found', message = 'The resource does not exist' } = {}) {
    return {
      statusCode,
      data: {
        code: errorCode,
        status: statusCode,
        description: message
      }
    }
  }

  failedDependencyResponse({ statusCode = 404, data = null }) {
    return {
      statusCode,
      data: {
        code: errorCode,
        status: statusCode,
        description: message
      }
    }
  }
}