import { Octokit } from '@octokit/rest';
import { LogLevel } from './logger';
import logger from './logger'

interface metricResult {
    rampup: number
    rampup_latency: number
  }

export const calculateRampUpTime = async (owner: string, repo: string, threshold: number = 50, octokit: Octokit): Promise<metricResult> => {
    const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
    if(currentLogLevel == LogLevel.INFO) {
        console.log('Running rampUpTime metric...');
    }

    return {
        rampup: 0,
        rampup_latency: 0,
    }
};
