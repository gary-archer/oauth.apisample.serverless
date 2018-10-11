'use strict';

const {TravelExperiencesError, ServerError} = require('./errors');
const {RequestError, TimeoutError, HTTPError} = require('got');

const server_error_code = 'internal_server_error'
const server_error_message = 'A technical problem was encountered in a Collinson API';

const network_error_code = 'internal_network_error'
const network_error_message = 'A network problem was encountered in a Collinson API';

const Logger = require('../logging');

class ErrorHandler {

    static handleServerException(exception) {
        const apiError = ErrorHandler.errorFromException(exception);

        Logger.error(apiError.serializeJson());

        return apiError;
    }

    static errorFromException(exception) {

        if(exception instanceof TravelExperiencesError) {
            return exception;
        }
        
        let details = {};

        // Network errors
        if(exception instanceof RequestError || exception instanceof TimeoutError) {
            details.message = exception.message;
            const serverError = new ServerError({
                message: network_error_message,
                errorCode: network_error_code,
                details
            });
            serverError.stack = exception.stack;
            return serverError;
        }

        // Code errors
        if(exception instanceof HTTPError) {
            details.message = exception.message;
            if(exception.response && exception.response.body) {
                details.response = exception.response.body;
            }

            const serverError = new ServerError({
                message: server_error_message,
                errorCode: server_error_code,
                details
            });
            serverError.stack = exception.stack;
            return serverError;
        }

        if(exception instanceof Error) {
            details.message = exception.message;
            const serverError = new ServerError({
                message: server_error_message,
                errorCode: server_error_code,
                details
            });
            serverError.stack = exception.stack;
            return serverError;
        }

        details.message = exception.toString();
        return new ServerError({
            message: server_error_message,
            errorCode: server_error_code,
            details
        });
    }
}

module.exports = ErrorHandler;