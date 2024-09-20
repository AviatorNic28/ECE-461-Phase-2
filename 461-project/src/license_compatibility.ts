import { Octokit } from '@octokit/rest';
import { LogLevel } from './logger';
import logger from './logger'

interface metricResult {
    license: number
    license_latency: number
  }

export const calculateLicenseCompatibility = async (owner: string, repo: string, threshold: number = 50, octokit: Octokit): Promise<metricResult> => {
    const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
    if(currentLogLevel == LogLevel.INFO) {
        console.log('Running License Compatibility...');
    }
    return {
        license: 0,
        license_latency: 0,
    }
};
