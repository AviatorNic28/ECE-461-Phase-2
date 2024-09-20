import { Octokit } from '@octokit/rest';
import moment from 'moment';
import { LogLevel } from './logger';
import logger from './logger'

interface metricResult {
  correctness: number
  correctness_latency: number
}

export const calculateCorrectness = async (owner: string, repo: string, octokit: Octokit): Promise<metricResult> => {
  const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
  if(currentLogLevel == LogLevel.INFO) {
    console.log('Running Correctness metric...');
  }
  
  try {
    // Fetch the package.json file from the repository
    const repoResponse = await octokit.repos.getContent({
      owner,
      repo,
      path: 'package.json',
    });

    // Check for the presence of tests in package.json
    if (!Array.isArray(repoResponse.data) && 'content' in repoResponse.data) {
      const packageJson = Buffer.from(repoResponse.data.content, 'base64').toString('utf-8');
      const packageData = JSON.parse(packageJson);

      const hasTests = packageData.scripts?.test ||
                       packageData.devDependencies?.['mocha'] ||
                       packageData.devDependencies?.['jest'] ||
                       packageData.devDependencies?.['chai'];

      if (hasTests) {
        console.log(`The repository "${owner}/${repo}" has testing setup.`);
      } else {
        console.log(`The repository "${owner}/${repo}" does not appear to have any testing setup.`);
      }
    } else {
      console.log(`Could not find package.json in repository "${owner}/${repo}".`);
    }

    // Fetch the number of open issues
    const issuesResponse = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'open',
    });

    const openIssues = issuesResponse.data;
    const openIssuesCount = openIssues.length;
    console.log(`The repository "${owner}/${repo}" has ${openIssuesCount} open issues.`);

    // Find the 3 longest open issues
    if (openIssuesCount > 0) {
      const sortedIssues = openIssues.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const longestOpenIssues = sortedIssues.slice(0, 3);

      console.log(`Longest open issues (up to 3):`);
      longestOpenIssues.forEach(issue => {
        const openFor = moment(issue.created_at).fromNow(true); // e.g., '3 months'
        console.log(`#${issue.number} - ${issue.title} (open for ${openFor})`);
      });
    }

  } catch (error) {
    console.error('Error calculating Correctness:', error);
    console.log('Error retrieving Correctness');
  }

  return {
    correctness: 0,
    correctness_latency: 0,
  }

};
