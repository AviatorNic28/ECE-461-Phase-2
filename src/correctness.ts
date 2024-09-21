import { Octokit } from '@octokit/rest';
import moment from 'moment';
import { LogLevel } from './logger';
import logger from './logger';
import { performance } from 'perf_hooks';

interface MetricResult {
  correctness: number;
  correctness_latency: number;
}

export const calculateCorrectness = async (owner: string, repo: string, octokit: Octokit): Promise<MetricResult> => {
  // get log level
  const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
  if (currentLogLevel === LogLevel.INFO) {
    logger.info('Running Correctness metric...');
  }

  // begin tracking latency
  const startTime = performance.now();


  let correctness = 0;
  const possibleTestDirs = ['test', 'tests', 'spec', '__tests__', 'Test', 'Tests']; // directories where tests may be.
  let testDirFound = false;

  try {
    // check if test directory exists.
    for (const dir of possibleTestDirs) {
      try {
        const repoResponse = await octokit.repos.getContent({
          owner,
          repo,
          path: dir,
        });

        if (Array.isArray(repoResponse.data) && repoResponse.data.length > 0) {
          if(currentLogLevel == LogLevel.INFO) {
            logger.info(`The repository "${owner}/${repo}" contains a '${dir}' directory.`);
          }
          
          testDirFound = true;
          correctness += 1;
          
          // exit once we find a valid test directory.
          break; 
        }
      } catch (error) {
        // Continue to the next directory to check.
      }
    }

    if (!testDirFound) {
      if(currentLogLevel == LogLevel.DEBUG) {
        logger.debug(`No recognized test directory found in repository "${owner}/${repo}".`); 
      }
    }

    // Fetch the number of open issues
    const issuesResponse = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'open',
    });

    const openIssues = issuesResponse.data;
    const openIssuesCount = openIssues.length;
    if(currentLogLevel == LogLevel.INFO ) {
      logger.info(`The repository "${owner}/${repo}" has ${openIssuesCount} open issues.`);
    }

    // deduct from correctness score as needed. 
    if(openIssuesCount >= 60) {
      correctness -= .8;
    } else if(openIssuesCount >= 40) {
      correctness -= .6;
    } else if(openIssuesCount >= 20) {
      correctness -= .4;
    } else if(openIssuesCount >= 10) {
      correctness -= .2;
    }

    // Find the 3 longest open issues
    if (openIssuesCount > 0) {
      const sortedIssues = openIssues.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const longestOpenIssues = sortedIssues.slice(0, 3);
      
      if(currentLogLevel == LogLevel.INFO) {
        logger.info('Longest open issues (up to 3):');
      }
      longestOpenIssues.forEach(issue => {
        const openFor = moment(issue.created_at).fromNow(true); // e.g., '3 months'
        if(currentLogLevel == LogLevel.DEBUG) {
        logger.info(`#${issue.number} - ${issue.title} (open for ${openFor})`);
        }
      });
    }

  } catch (error) {
    if(currentLogLevel == LogLevel.DEBUG) {
      logger.error('Error calculating Correctness:', error);
    }
      return {
        correctness : -1,
        correctness_latency : -1,
      }
  }

  // calculate latency (seconds).
  const endTime = performance.now();
  const latency = (endTime - startTime) / 1000;

  return {
    correctness: Math.max(correctness, 0),
    correctness_latency: latency,
  };
};
