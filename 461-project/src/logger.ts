import winston from 'winston';

export enum LogLevel {
    NONE = 0,
    INFO = 1,
    DEBUG = 2,
}

// read in env vars.
const logLevel = process.env.LOG_LEVEL;
const logFile = process.env.LOG_FILE;

const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: logFile })
    ]
});

export default logger;
