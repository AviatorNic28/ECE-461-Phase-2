import { Octokit } from '@octokit/rest';
import moment from 'moment';

export const calculateResponsiveness = async (owner: string, repo: string, octokit: Octokit) => {
  console.log('Running Responsiveness metric...');
  
  try {
    const issuesResponse = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      per_page: 100,
    });

    const issues = issuesResponse.data;
    const responseTimestamps: string[] = [];

    for (const issue of issues) {
      const eventsResponse = await octokit.issues.listEventsForTimeline({
        owner,
        repo,
        issue_number: issue.number,
        per_page: 1,
      });

      if (eventsResponse.data.length > 0) {
        const firstEvent = eventsResponse.data[0];
        if (firstEvent.created_at) {
          responseTimestamps.push(firstEvent.created_at);
        }
      }
    }

    if (responseTimestamps.length > 0) {
      const totalMilliseconds = responseTimestamps.reduce((total, timestamp) => {
        const duration = moment.duration(moment().diff(moment(timestamp)));
        return total + duration.asMilliseconds();
      }, 0);

      const averageResponseTimeInMs = totalMilliseconds / responseTimestamps.length;
      const averageResponseTimeInHours = averageResponseTimeInMs / (1000 * 60 * 60);

      console.log(`Average response time for "${owner}/${repo}" is: ${averageResponseTimeInHours.toFixed(2)} hours`);
    } else {
      console.log(`No events found for issues in repository "${owner}/${repo}".`);
    }
  } catch (error) {
    console.error('Error calculating Responsiveness:', error);
    console.log('Error retrieving Responsiveness');
  }
};

