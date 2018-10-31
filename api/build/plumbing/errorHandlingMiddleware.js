"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apiLogger_1 = require("./apiLogger");
/*
 * Custom middleware for error handling
 */
exports.errorHandlingMiddleware = (config) => {
    return ({
        onError: (handler, next) => {
            apiLogger_1.ApiLogger.info('ErrorMiddleware', 'error');
            apiLogger_1.ApiLogger.info('ErrorMiddleware', handler.error);
        },
    });
};
