import { 
    CloudWatchLogsClient, 
    PutLogEventsCommand,
    CreateLogStreamCommand,
    DescribeLogStreamsCommand 
  } from "@aws-sdk/client-cloudwatch-logs";
  import winston from 'winston';
  import Transport from 'winston-transport';
  
  export enum LogLevel {
    SILENT = 0,
    INFO = 1,
    DEBUG = 2
  }
  
  // Custom CloudWatch transport to handle sequence tokens
  class CloudWatchTransport extends Transport {
    private client: CloudWatchLogsClient;
    private logGroupName: string;
    private logStreamName: string;
    private sequenceToken: string | undefined;
  
    constructor(opts?: Transport.TransportStreamOptions) {
      super(opts);
      this.client = new CloudWatchLogsClient({ region: "us-east-1" });
      this.logGroupName = "/ece461/trustworthy-module-registry";
      this.logStreamName = new Date().toISOString().split('T')[0]; // use date as stream name
      this.initializeLogStream();
    }
  
    private async initializeLogStream() {
      try {
        // Try to create log stream
        await this.client.send(new CreateLogStreamCommand({
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName
        }));
      } catch (error: any) {
        // If stream exists, get the sequence token
        if (error.name === 'ResourceAlreadyExistsException') {
          const describeStreamsResponse = await this.client.send(
            new DescribeLogStreamsCommand({
              logGroupName: this.logGroupName,
              logStreamNamePrefix: this.logStreamName
            })
          );
          
          const stream = describeStreamsResponse.logStreams?.find(
            stream => stream.logStreamName === this.logStreamName
          );
          this.sequenceToken = stream?.uploadSequenceToken;
        } else {
          console.error('Failed to initialize CloudWatch log stream:', error);
        }
      }
    }
  
    async log(info: winston.LogEntry, callback: () => void) {
      try {
        const command = new PutLogEventsCommand({
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName,
          sequenceToken: this.sequenceToken,
          logEvents: [{
            timestamp: Date.now(),
            message: JSON.stringify({
              level: info.level,
              message: info.message,
              ...(info.metadata && Object.keys(info.metadata).length > 0 ? { metadata: info.metadata } : {})
            })
          }]
        });
  
        const response = await this.client.send(command);
        this.sequenceToken = response.nextSequenceToken;
        callback();
      } catch (error) {
        console.error('Failed to send logs to CloudWatch:', error);
        callback();
      }
    }
  }
  
  // Create format for all necessary information
  const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  });
  
  // Create logger instance
  const createLogger = () => {
    // Get environment variables with defaults
    const logLevel = parseInt(process.env.LOG_LEVEL || '0', 10);
    const logFile = process.env.LOG_FILE;
  
    // Map numeric levels to winston levels
    const levelMap: { [key: number]: string } = {
      0: 'error', // SILENT - only log errors
      1: 'info',  // INFO
      2: 'debug'  // DEBUG
    };
  
    // Configure transports based on log level
    const transports: winston.transport[] = [];
  
    // Add transports if not SILENT
    if (logLevel > LogLevel.SILENT) {
      // Add CloudWatch transport if not SILENT
      transports.push(new CloudWatchTransport({
        level: levelMap[logLevel]
      }));
  
      // Add file transport if LOG_FILE specified
      if (logFile) {
        transports.push(new winston.transports.File({
          filename: logFile,
          level: levelMap[logLevel],
          format: winston.format.combine(
            winston.format.timestamp(),
            customFormat
          )
        }));
      }
    }
  
    return winston.createLogger({
      level: levelMap[logLevel],
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.metadata(),
        customFormat
      ),
      transports
    });
  };
  
  // Create and export the logger instance
  const logger = createLogger();
  
  export const logDebug = (message: string, metadata?: any) => {
    if (parseInt(process.env.LOG_LEVEL || '0', 10) >= LogLevel.DEBUG) {
      logger.debug(message, metadata);
    }
  };
  
  export const logInfo = (message: string, metadata?: any) => {
    if (parseInt(process.env.LOG_LEVEL || '0', 10) >= LogLevel.INFO) {
      logger.info(message, metadata);
    }
  };
  
  export const logError = (message: string, error?: Error) => {
    logger.error(message, {
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    });
  };
  
  export default logger;