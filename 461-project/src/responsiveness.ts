import { Octokit } from '@octokit/rest';
import moment from 'moment';
import { LogLevel } from './logger';
import logger from './logger'
import { performance } from 'perf_hooks';

interface metricResult {
  responsiveness: number
  responsiveness_latency: number
}

export const calculateResponsiveness = async (owner: string, repo: string, octokit: Octokit): Promise<metricResult> => {
  const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
  if(currentLogLevel == LogLevel.INFO) {
    console.log('Running responsiveness metric...');
  }
  
  const startTime = performance.now(); // Start measuring time

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
      
      if(currentLogLevel == LogLevel.INFO) {
          console.log(`Average response time for "${owner}/${repo}" is: ${averageResponseTimeInHours.toFixed(2)} hours`);
      }

      // scale metric between 0 and 1.
      // SCALE: 1 = within 1 week , .75 = within 2 weeks, .5 = within 3 weeks , .25 = within 4 weeks, > 4 weeks , 0. 
      let responsiveScore = -1;
      if(averageResponseTimeInHours <= 24 * 7) {
        responsiveScore = 1;
      } else if(averageResponseTimeInHours <= 24 * 14) {
        responsiveScore = .75;
      } else if(averageResponseTimeInHours <= 24 * 21) {
        responsiveScore = .5;
      } else if(averageResponseTimeInHours <= 24 * 28) {
        responsiveScore = .25; 
      } else {
        responsiveScore = 0;
      }

      const endTime = performance.now(); // End measuring time
      const latency = (endTime - startTime) / 1000; // Calculate latency (seconds)

      return {
        responsiveness: responsiveScore,
        responsiveness_latency: latency, 
      }

    } else {
      console.log(`No events found for issues in repository "${owner}/${repo}".`);
      return {
        responsiveness: -1,
        responsiveness_latency: -1,
      }
    }
  } catch (error) {
    console.error('Error calculating Responsiveness:', error);
    if(currentLogLevel == LogLevel.DEBUG) {
    logger.debug('Error retrieving Responsiveness');
    }
    return {
      responsiveness: -1,
      responsiveness_latency: -1,
    }
  }
};

