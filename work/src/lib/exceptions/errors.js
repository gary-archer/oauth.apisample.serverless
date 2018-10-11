'use strict';

const MIN_ERROR_ID = 10000;
const MAX_ERROR_ID = 99999;
const INTERNAL_SERVER_ERROR = 'internal_server_error';

function generateCorrelationId() {
    return Math.floor(Math.random() * (MAX_ERROR_ID - MIN_ERROR_ID + 1) + MIN_ERROR_ID).toString();
}

function UTCNow() {
    return new Date().toUTCString();
}

class TravelExperiencesError extends Error {
    constructor({message, statusCode, errorCode, time}) {
        super(message);
        this._statusCode = statusCode;
        this._errorCode = errorCode;
        this._time = time;
    }

    get statusCode() {
        return this._statusCode;
    }

    get errorCode() {
        return this._errorCode;
    }

    set errorCode(value) {
        this._errorCode = value;
    }

    get time() {
        return this._time;
    }

    serializeJson() {
        const copy = Object.assign({}, this);
        copy.stackTrace = this.stack;
        return JSON.stringify(copy);
    }
}

class ServerError extends TravelExperiencesError {
    constructor({message, statusCode = 500, errorCode = INTERNAL_SERVER_ERROR, time = UTCNow(), correlationId = generateCorrelationId(), details = {}}) {
        super({message, statusCode, errorCode, time});
        this._correlationId = correlationId;
        this._details = details;
    }

    get details() {
        return this._details;
    }

    get correlationId() {
        return this._correlationId;
    }
}

class ValidationError extends TravelExperiencesError {
    constructor({errorDescription, errorCode, statusCode = 400, time = UTCNow(), details = {}}) {
        super({message: errorDescription, errorCode, statusCode, time});
        this._errorMessage = errorDescription;
        this._details = details;
    }

    get errorMessage() {
        return this._errorMessage;
    }

    get details() {
        return this._details;
    }

    serializeJson() {
        const copy = Object.assign({}, this);
        return JSON.stringify(copy);
    }
}

module.exports.TravelExperiencesError = TravelExperiencesError;
module.exports.ServerError = ServerError;
module.exports.ValidationError = ValidationError;