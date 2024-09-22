import { Octokit } from '@octokit/rest';
import { LogLevel } from './logger';
import logger from './logger'
import { performance } from 'perf_hooks';


interface metricResult {
  busfactor: number
  busfactor_latency: number
}

export const calculateBusFactor = async (owner: string, repo: string, threshold: number = 50, octokit: Octokit): Promise<metricResult> => {
  // first get log level. 
  const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
  if(currentLogLevel == LogLevel.INFO) {
    logger.info('Running Bus Factor metric...')
  }

  // begin tracking latency. 
  const startTime = performance.now();
  let busFactor = 0;

  try {
    // Fetch contributors from the GitHub repository
    const contributorsResponse = await octokit.repos.listContributors({
      owner,
      repo,
    });

    const contributors = contributorsResponse.data.map(contributor => ({
      login: contributor.login,
      commits: contributor.contributions, // GitHub API returns contribution count as 'contributions'
    }));

    // Sort contributors by number of commits in descending order
    contributors.sort((a, b) => b.commits - a.commits);

    // Calculate total number of commits in the repo
    const totalCommits = contributors.reduce((total, contributor) => total + contributor.commits, 0);

    // Calculate cumulative percentage of commits and find bus factor
    let cumulativeCommits = 0;

    for (const contributor of contributors) {
      cumulativeCommits += contributor.commits;
      busFactor++;
      const percentage = (cumulativeCommits / totalCommits) * 100;

      // If cumulative percentage reaches or exceeds the threshold, we've found the Bus Factor
      if (percentage >= threshold) {
        break;
      }
    }

  } catch (error) {
    if(currentLogLevel == LogLevel.DEBUG) {
      logger.debug('Error calculating Bus Factor:', error);
    }
    
    return {
      busfactor : -1,
      busfactor_latency : -1,
    }
  
  }

  // SCALE busfactor between 0 and 1 
  // people <= 2 : 0 , people <= 4 : .25 , people <= 6 : .5 , people <= 8 : .75 , else : 1. 
  let scaledBusFactor = -1; 
  if(busFactor <= 2) {
    scaledBusFactor = 0;
  } else if(busFactor <= 4) {
    scaledBusFactor = .25;
  } else if(busFactor <= 6) {
    scaledBusFactor = .5;
  } else if(busFactor <= 8) {
    scaledBusFactor = .75;
  } else {
    scaledBusFactor = 1;
  }

  // calculate latency (seconds)
  const endTime = performance.now();
  const latency = (endTime - startTime) / 1000;
  
  return {
    busfactor: scaledBusFactor,
    busfactor_latency: latency,
  }
};
