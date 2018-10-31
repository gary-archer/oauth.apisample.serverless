"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apiLogger_1 = require("./apiLogger");
/*
 * Custom middleware for authorization
 */
exports.authorizationMiddleware = (config) => {
    return ({
        before: (handler, next) => {
            apiLogger_1.ApiLogger.info('AuthorizationMiddleware', 'before');
            return next();
        },
    });
};
