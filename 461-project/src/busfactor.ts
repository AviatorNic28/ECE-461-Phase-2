import { Octokit } from '@octokit/rest';
import { LogLevel } from './logger';
import logger from './logger'

interface metricResult {
  busfactor: number
  busfactory_latency: number
}

export const calculateBusFactor = async (owner: string, repo: string, threshold: number = 50, octokit: Octokit): Promise<metricResult> => {
  const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
  if(currentLogLevel == LogLevel.INFO) {
    console.log('Running Bus Factor metric...'); 
  }

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
    let busFactor = 0;

    for (const contributor of contributors) {
      cumulativeCommits += contributor.commits;
      busFactor++;
      const percentage = (cumulativeCommits / totalCommits) * 100;

      // If cumulative percentage reaches or exceeds the threshold, we've found the Bus Factor
      if (percentage >= threshold) {
        break;
      }
    }

    console.log(`Bus Factor for repository "${owner}/${repo}" is: ${busFactor}`);
  } catch (error) {
    console.error('Error calculating Bus Factor:', error);
    console.log('Error retrieving Bus Factor');
  }

  return {
    busfactor: 0,
    busfactory_latency: 0,
  }
};
