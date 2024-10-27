import winston from 'winston';
import Transport from 'winston-transport';
import { CloudWatchLogsClient, PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";

export enum LogLevel {
    NONE = 0,
    INFO = 1,
    DEBUG = 2,
}

const logLevel = process.env.LOG_LEVEL || '0';
const logFile = process.env.LOG_FILE || 'app.log';

// AWS CloudWatch configuration
const cloudWatchClient = new CloudWatchLogsClient({ region: "us-east-1" });
const logGroupName = "/ece461/trustworthy-module-registry";
const logStreamName = "application-logs";

// Custom CloudWatch transport for Winston
class CloudWatchTransport extends Transport {
  private client: CloudWatchLogsClient;

  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts);
    this.client = cloudWatchClient;
  }

  log(info: winston.LogEntry, callback: () => void): void {
    const logEvent = {
      message: JSON.stringify(info),
      timestamp: new Date().getTime()
    };

    const command = new PutLogEventsCommand({
      logGroupName,
      logStreamName,
      logEvents: [logEvent]
    });

    this.client.send(command)
      .then(() => callback())
      .catch((err) => callback());
  }
}

const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: logFile }),
        new CloudWatchTransport()
    ]
});

export default logger;
