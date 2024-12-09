/**
 * Responsiveness Metric Handler
 *
 * This AWS Lambda function calculates the Responsiveness metric for a given npm package
 * hosted on GitHub. Responsiveness is determined by the average time taken to close issues
 * in the repository. The score is normalized to fall within the range [0, 1].
 *
 *
 * @function handler
 * @param {Object} event - The AWS Lambda event object containing the input request.
 * @param {string} event.body - The JSON stringified request body (if applicable).
 *
 * @returns {Object} - HTTP response object with the calculated metric and normalized score.
 * @property {number} statusCode - The HTTP status code of the response.
 * @property {Object} body - The JSON object containing the metric name and the normalized score.
 *
 * @example Input:
 * {
 *   "moduleName": "facebook/react"
 * }
 *
 * @example Output:
 * {
 *   "metric": "Responsiveness",
 *   "score": 0-1
 * }
 *
 * @throws {Error} - Throws an error if required parameters are missing, or if there is an issue with GitHub API requests.
 */

import axios from "axios";

export const handler = async (event) => {
    try {
        // Parse the request body
        const body = event.body ? JSON.parse(event.body) : event;
        const { moduleName } = body;

        // Validate input: Ensure `moduleName` is provided
        if (!moduleName) {
            throw new Error("Missing moduleName in the request body");
        }

        console.log(`Processing Responsiveness Metric for Package: ${moduleName}`);

        // Construct GitHub API URL to fetch closed issues
        const issuesUrl = `https://api.github.com/repos/${moduleName}/issues?state=closed`;

        // Fetch closed issues from GitHub API
        const response = await axios.get(issuesUrl, {
            headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
        });

        const issues = response.data;

        // Initialize variables to calculate average response time
        let totalResponseTime = 0; // Sum of response times in hours
        let issueCount = 0; // Count of issues with valid response times

        // Process each closed issue
        issues.forEach((issue) => {
            if (issue.created_at && issue.closed_at) {
                // Calculate response time for each issue
                const createdAt = new Date(issue.created_at);
                const closedAt = new Date(issue.closed_at);
                totalResponseTime += (closedAt - createdAt) / (1000 * 60 * 60); // Time in hours
                issueCount += 1;
            }
        });

        // Calculate average response time in hours
        const avgResponseTime = issueCount > 0 ? totalResponseTime / issueCount : 0;
        console.log(`Average Response Time (hours): ${avgResponseTime}`);

        // Normalize the score to range [0, 1]
        // - If avgResponseTime <= 24 hours, score = 1
        // - If avgResponseTime >= 48 hours, score = 0
        // - Linear interpolation for values between 24 and 48 hours
        const normalizedScore = avgResponseTime <= 24
            ? 1
            : avgResponseTime >= 48
                ? 0
                : 1 - (avgResponseTime - 24) / 24;

        console.log(`Normalized Responsiveness Score: ${normalizedScore}`);

        // Return the calculated metric and score
        return {
            statusCode: 200,
            body: JSON.stringify({
                metric: "Responsiveness",
                score: normalizedScore,
            }),
        };
    } catch (error) {
        // Log and return errors
        console.error("Error calculating Responsiveness:", error.message);
        console.error("Full Error:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Error calculating Responsiveness",
                error: error.message,
            }),
        };
    }
};
