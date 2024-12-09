/**
 * Bus Factor Metric Handler
 *
 * This AWS Lambda function calculates the Bus Factor metric for a given npm package 
 * hosted on GitHub. The Bus Factor represents the number of contributors to a project, 
 * and the score is normalized to fall within the range [0, 1]. If the number of 
 * contributors exceeds 10, the score is capped at 1.
 *
 * @function handler
 * @param {Object} event - The AWS Lambda event object containing the input request.
 * @param {string} event.body - The JSON stringified request body (if applicable).
 * 
 * @returns {Object} - HTTP response object with the calculated metric and score.
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
 *   "metric": "Bus Factor",
 *   "score": 0.75
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

        console.log(`Processing Bus Factor Metric for Package: ${moduleName}`);

        // Fetch contributors from GitHub API
        const apiUrl = `https://api.github.com/repos/${moduleName}/contributors`;
        const response = await axios.get(apiUrl, {
            headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
        });

        const contributors = response.data;
        console.log(`Contributors Found: ${contributors.length}`);

        // Calculate Bus Factor Score (normalize to range [0, 1])
        const rawScore = contributors.length;
        const normalizedScore = Math.min(rawScore / 10, 1);

        console.log(`Normalized Bus Factor Score: ${normalizedScore}`);

        // Return the calculated metric
        return {
            statusCode: 200,
            body: JSON.stringify({
                metric: "Bus Factor",
                score: normalizedScore,
            }),
        };
    } catch (error) {
        // Log and return errors
        console.error("Error calculating Bus Factor:", error.message);
        console.error("Full Error:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Error calculating Bus Factor",
                error: error.message,
            }),
        };
    }
};
