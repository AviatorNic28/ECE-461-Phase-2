import { Octokit } from '@octokit/rest';
import { LogLevel } from './logger';
import logger from './logger';
import { performance } from 'perf_hooks';
import { HTML5_FMT } from 'moment';

interface metricResult {
    rampup: number;
    rampup_latency: number;
}

export const calculateRampUpTime = async (owner: string, repo: string, threshold: number = 50, octokit: Octokit): Promise<metricResult> => {
    const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
    if (currentLogLevel === LogLevel.INFO) {
        logger.info('Running rampUpTime metric...');
    }

    const startTime = performance.now(); // Start measuring time
    let rampUpScore = 0;

    try {
        // 1. Fetch the README file (to estimate documentation complexity)
        const readmeResponse = await octokit.repos.getReadme({
            owner,
            repo,
        });

        const readmeSize = readmeResponse.data.size; // Size in bytes
        logger.info(`README size: ${readmeSize} bytes`);

        // Simple scoring based on README size
        if (readmeSize > 10000) {
            rampUpScore += 50; // Large README = good documentation
        } else if (readmeSize > 5000) {
            rampUpScore += 30;
        } else if (readmeSize > 1000) {
            rampUpScore += 10;
        }

        // 2. Get the number of unique contributors
        const contributorsResponse = await octokit.repos.listContributors({
            owner,
            repo,
        });

        const numContributors = contributorsResponse.data.length;
        logger.info(`Number of contributors: ${numContributors}`);

        // Scoring based on the number of contributors
        if (numContributors > 15) {
            rampUpScore += 50; // High contribution activity
        } else if (numContributors > 10) {
            rampUpScore += 30;
        } else if (numContributors > 5) {
            rampUpScore += 10;
        }

    } catch (error) {
        //logger.error(`Error calculating ramp-up time for ${owner}/${repo}: ${error.message}`);
    }

    const endTime = performance.now(); // End measuring time
    const latency = (endTime - startTime) / 1000; // Calculate latency (seconds)

    // Normalize the ramp-up score based on a threshold
    const normalizedRampUpScore = rampUpScore / 100;

    return {
        rampup: normalizedRampUpScore,
        rampup_latency: latency,
    };
};
