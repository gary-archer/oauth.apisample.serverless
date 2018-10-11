'use strict';

const winston = require('winston');
let timer;

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            colorize: true,
            format: winston.format.simple(),
            level: getLogLevel()
        })
    ]
});

let requestId = '';

const setRequestId = (id) => requestId = id;

const error = (...args) => logger.error(`RequestId: ${requestId} ${args.join(' : ')}`);

const info = (...args) => logger.info(`RequestId: ${requestId} ${args.join(' : ')}`);

const warn = (...args) => logger.warn(`RequestId: ${requestId} ${args.join(' : ')}`);

const debug = (...args) => logger.debug(`RequestId: ${requestId} ${args.join(' : ')}`);

const time = (name) => timer = winston.startTimer(name);
  
const timeEnd = (name) => timer.done(name);

function getLogLevel() {
    const environmentLogLevel = process.env.LogLevel && process.env.LogLevel.toLowerCase();
    const validLogLevels = ['off', 'error', 'warn', 'info', 'verbose', 'debug'];
    const defaultLogLevel = 'error';

    return validLogLevels.find(l => l == environmentLogLevel) || defaultLogLevel;
}

module.exports = { error, info, warn, debug, time, timeEnd, setRequestId };