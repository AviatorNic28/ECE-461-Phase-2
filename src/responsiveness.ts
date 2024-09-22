import { Octokit } from '@octokit/rest';
import moment from 'moment';
import { LogLevel } from './logger';
import logger from './logger';
import { performance } from 'perf_hooks';

interface metricResult {
  responsiveness: number;
  responsiveness_latency: number;
}

export const calculateResponsiveness = async (owner: string, repo: string, octokit: Octokit): Promise<metricResult> => {
  const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
  if (currentLogLevel == LogLevel.INFO) {
    logger.info("Running responsiveness metric...");
  }

  // begin measuring latency
  const startTime = performance.now();

  try {
    const issuesResponse = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      per_page: 100,  // Fetch up to 100 issues at once
    });

    const issues = issuesResponse.data;

    // Map all issues to promises for parallel event requests
    const eventPromises = issues.map(async (issue) => {
      try {
        const eventsResponse = await octokit.issues.listEventsForTimeline({
          owner,
          repo,
          issue_number: issue.number,
          per_page: 1,  // Fetch the first event (as only first response is needed)
        });

        const firstEvent = eventsResponse.data[0];
        return firstEvent?.created_at ? firstEvent.created_at : null;
      } catch (error) {
        if (currentLogLevel == LogLevel.DEBUG) {
          logger.debug(`Failed to fetch events for issue #${issue.number}:`, error);
        }
        return null;
      }
    });

    // Wait for all promises to resolve
    const responseTimestamps = (await Promise.all(eventPromises)).filter(Boolean) as string[];

    if (responseTimestamps.length > 0) {
      const totalMilliseconds = responseTimestamps.reduce((total, timestamp) => {
        const duration = moment.duration(moment().diff(moment(timestamp)));
        return total + duration.asMilliseconds();
      }, 0);

      const averageResponseTimeInMs = totalMilliseconds / responseTimestamps.length;
      const averageResponseTimeInHours = averageResponseTimeInMs / (1000 * 60 * 60);

      // Calculate responsiveness score
      let responsiveScore = -1;
      if (averageResponseTimeInHours <= 24 * 7) {
        responsiveScore = 1;
      } else if (averageResponseTimeInHours <= 24 * 14) {
        responsiveScore = 0.75;
      } else if (averageResponseTimeInHours <= 24 * 21) {
        responsiveScore = 0.5;
      } else if (averageResponseTimeInHours <= 24 * 28) {
        responsiveScore = 0.25;
      } else {
        responsiveScore = 0;
      }

      // measure latency
      const endTime = performance.now();
      const latency = (endTime - startTime) / 1000;

      return {
        responsiveness: responsiveScore,
        responsiveness_latency: latency,
      };
    } else {

      return {
        responsiveness: -1,
        responsiveness_latency: -1,
      };
    }
  } catch (error) {
    if (currentLogLevel == LogLevel.DEBUG) {
      logger.debug('Error retrieving Responsiveness:', error);
    }

    return {
      responsiveness: -1,
      responsiveness_latency: -1,
    };
  }
};
