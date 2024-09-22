import { Octokit } from '@octokit/rest';
import { LogLevel } from './logger';
import logger from './logger';
import { performance } from 'perf_hooks';

interface metricResult {
    rampup: number;
    rampup_latency: number;
}

export const calculateRampUpTime = async (owner: string, repo: string, octokit: Octokit): Promise<metricResult> => {
    const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);

    // begin tracking latency
    const startTime = performance.now();
    let rampUpScore = 0;

    try {
        // get readme.
        const readmeResponse = await octokit.repos.getReadme({
            owner,
            repo,
        });

        // size (bytes)
        const readmeSize = readmeResponse.data.size; 

        // Simple scoring based on README size
        if (readmeSize > 10000) {
            rampUpScore += .5;
        } else if (readmeSize > 5000) {
            rampUpScore += .3;
        } else if (readmeSize > 1000) {
            rampUpScore += .1;
        }

        // get unique contributors.
        const contributorsResponse = await octokit.repos.listContributors({
            owner,
            repo,
        });

        const numContributors = contributorsResponse.data.length;

        // Scoring based on the number of contributors
        if (numContributors > 15) {
            rampUpScore += .5; 
        } else if (numContributors > 10) {
            rampUpScore += .3;
        } else if (numContributors > 5) {
            rampUpScore += .1;
        }

    } catch (error) {
        if(currentLogLevel == LogLevel.DEBUG) {
        logger.error(`Error calculating ramp-up time for ${owner}/${repo}: ${error}`);
        }
        return {
            rampup: -1,
            rampup_latency : -1,
        }
    }

    // record latency (seconds)
    const endTime = performance.now(); 
    const latency = (endTime - startTime) / 1000; 

    return {
        rampup: rampUpScore,
        rampup_latency: latency,
    };
};
