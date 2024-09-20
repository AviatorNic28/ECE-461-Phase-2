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
  const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
  if (currentLogLevel === LogLevel.INFO) {
    logger.info('Running Correctness metric...');
  }

  const startTime = performance.now(); // Start measuring time

  let correctness = 0;
  const possibleTestDirs = ['test', 'tests', 'spec', '__tests__', 'Test', 'Tests'];
  let testDirFound = false;

  try {
    // Check for each possible test directory
    for (const dir of possibleTestDirs) {
      try {
        const repoResponse = await octokit.repos.getContent({
          owner,
          repo,
          path: dir,
        });

        if (Array.isArray(repoResponse.data) && repoResponse.data.length > 0) {
          logger.info(`The repository "${owner}/${repo}" contains a '${dir}' directory.`);
          testDirFound = true;
          // possibily implement better calculation method for correctness.
          correctness += 1; // Increment correctness if any test directory is present
          break; // Exit the loop once a test directory is found
        }
      } catch (error) {
        // Continue to the next directory to check.
      }
    }

    if (!testDirFound) {
      logger.info(`No recognized test directory found in repository "${owner}/${repo}".`);
    }

    // Fetch the number of open issues
    const issuesResponse = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'open',
    });

    const openIssues = issuesResponse.data;
    const openIssuesCount = openIssues.length;
    logger.info(`The repository "${owner}/${repo}" has ${openIssuesCount} open issues.`);

    // Deduct 0.01 from correctness score per open issue
    correctness -= openIssuesCount * 0.01;

    // Find the 3 longest open issues
    if (openIssuesCount > 0) {
      const sortedIssues = openIssues.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const longestOpenIssues = sortedIssues.slice(0, 3);

      logger.info('Longest open issues (up to 3):');
      longestOpenIssues.forEach(issue => {
        const openFor = moment(issue.created_at).fromNow(true); // e.g., '3 months'
        logger.info(`#${issue.number} - ${issue.title} (open for ${openFor})`);
      });
    }

  } catch (error) {
    logger.error('Error calculating Correctness:', error);
    logger.info('Error retrieving Correctness');
  }

  const endTime = performance.now(); // End measuring time
  const latency = (endTime - startTime) / 1000; // Calculate latency (seconds)

  return {
    correctness: Math.max(correctness, 0), // Ensure correctness doesn't go negative
    correctness_latency: latency,
  };
};
