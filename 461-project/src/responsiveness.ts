import { Octokit } from '@octokit/rest';
import moment from 'moment';
import { LogLevel } from './logger';
import logger from './logger'

interface metricResult {
  responsiveness: number
  responsiveness_latency: number
}

export const calculateResponsiveness = async (owner: string, repo: string, octokit: Octokit): Promise<metricResult> => {
  const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
  if(currentLogLevel == LogLevel.INFO) {
    console.log('Running responsiveness metric...');
  }
  
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

      return {
        responsiveness: averageResponseTimeInHours,
        responsiveness_latency: averageResponseTimeInMs, 
      }

    } else {
      console.log(`No events found for issues in repository "${owner}/${repo}".`);
      return {
        responsiveness: 0,
        responsiveness_latency: 0,
      }
    }
  } catch (error) {
    console.error('Error calculating Responsiveness:', error);
    console.log('Error retrieving Responsiveness');
    return {
      responsiveness: 0,
      responsiveness_latency: 0,
    }
  }
};

