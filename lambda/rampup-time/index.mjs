/**
 * Ramp-Up Time Metric Handler
 *
 * This AWS Lambda function calculates the Ramp-Up Time metric for a given module by 
 * evaluating the length of its README file. The assumption is that a well-documented 
 * and detailed README improves the developer's ability to quickly ramp up on the project.
 *
 * The score is normalized between 0 and 1 based on the length of the README file, with
 * a maximum score of 1 for files longer than 5000 characters.
 *
 * @function handler
 * @param {Object} event - The AWS Lambda event object containing the input request.
 * @param {string} event.body - JSON string containing the moduleName in the request.
 *
 * @returns {Object} - HTTP response object.
 * @property {number} statusCode - The HTTP status code of the response.
 * @property {Object} body - The JSON object containing the metric and score.
 *
 * @example Input:
 * {
 *   "body": "{\"moduleName\": \"facebook/react\"}"
 * }
 *
 * @example Output:
 * {
 *   "metric": "Ramp-Up Time",
 *   "score": 0.85
 * }
 *
 * @throws {Error} - Throws an error if required parameters are missing or if external
 * API calls fail.
 */

import axios from "axios";

export const handler = async (event) => {
    try {
        // Parse the input body and extract the moduleName
        const body = event.body ? JSON.parse(event.body) : event;
        const { moduleName } = body;

        if (!moduleName) {
            throw new Error("Missing moduleName in the request body");
        }

        console.log(`Processing Ramp-Up Time Metric for Package: ${moduleName}`);

        // Step 1: Construct the API URL for the README
        const apiUrl = `https://api.github.com/repos/${moduleName}/readme`;

        // Step 2: Fetch the README content from the GitHub API
        const response = await axios.get(apiUrl, {
            headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
        });

        // Step 3: Check if README exists and decode its content
        if (!response.data || !response.data.content) {
            console.error("README not found or invalid response");
            return {
                statusCode: 200,
                body: JSON.stringify({ metric: "Ramp-Up Time", score: 0.0 }),
            };
        }

        const readmeContent = Buffer.from(response.data.content, "base64").toString("utf8");
        console.log(`Decoded README Content: ${readmeContent.substring(0, 100)}...`); // Log first 100 characters for brevity

        // Step 4: Calculate the Ramp-Up Time score
        const readmeLength = readmeContent.length;
        const score = Math.min(readmeLength / 5000, 1.0); // Normalize score (max 1.0)

        console.log(`Ramp-Up Time Score: ${score}`);

        // Step 5: Return the calculated score
        return {
            statusCode: 200,
            body: JSON.stringify({ metric: "Ramp-Up Time", score }),
        };
    } catch (error) {
        // Log and handle errors
        console.error("Error calculating Ramp-Up Time:", error.message);
        console.error("Full Error:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Error calculating Ramp-Up Time",
                error: error.message,
            }),
        };
    }
};
