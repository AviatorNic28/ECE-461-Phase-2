/**
 * Pinned Dependencies Metric Handler
 *
 * This AWS Lambda function calculates the fraction of pinned dependencies for a given
 * npm package hosted on GitHub. It fetches the `package.json` file for the specified module,
 * combines `dependencies` and `devDependencies`, and calculates the fraction of dependencies
 * pinned to at least a specific major and minor version (e.g., `1.2.x`). this is to be used with
 * the rating handler function to score an npm module.
 *
 * @function handler
 * @param {Object} event - The AWS Lambda event object containing the input request.
 * @param {string} event.body - The JSON stringified request body (if applicable).
 * 
 * @returns {Object} - HTTP response object with the calculated metric and score.
 * @property {number} statusCode - The HTTP status code of the response.
 * @property {Object} body - The JSON object containing the metric name, the fraction of pinned dependencies, and the calculated score.
 *
 * @example Input:
 * {
 *   "moduleName": "facebook/react"
 * }
 *
 * @example Output:
 * {
 *   "metric": "Pinned Dependencies",
 *   "fractionPinned": 0-1,
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

        console.log(`Processing Pinned Dependencies Metric for Package: ${moduleName}`);

        // Fetch the default branch of the GitHub repository
        const branchResponse = await axios.get(
            `https://api.github.com/repos/${moduleName}`,
            {
                headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
            }
        );

        const defaultBranch = branchResponse.data.default_branch || "master";
        console.log(`Default branch for ${moduleName} is ${defaultBranch}`);

        // Fetch the package.json file from the repository
        const packageUrl = `https://raw.githubusercontent.com/${moduleName}/${defaultBranch}/package.json`;
        let packageJson;

        try {
            const response = await axios.get(packageUrl, {
                headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
            });
            packageJson = response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.error(`package.json not found at ${packageUrl}`);
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        metric: "Pinned Dependencies",
                        fractionPinned: 0,
                        message: "package.json not found",
                    }),
                };
            }
            throw error;
        }

        // Combine dependencies and devDependencies
        const dependencies = packageJson.dependencies || {};
        const devDependencies = packageJson.devDependencies || {};
        const allDependencies = { ...dependencies, ...devDependencies };

        // Calculate the fraction of pinned dependencies
        let pinnedCount = 0;
        const totalCount = Object.keys(allDependencies).length;

        for (const dep in allDependencies) {
            const version = allDependencies[dep];
            // Check if the version string is pinned to at least major.minor.x
            if (/^\d+\.\d+\./.test(version)) {
                pinnedCount++;
            }
        }

        const fractionPinned = totalCount === 0 ? 1.0 : pinnedCount / totalCount;
        console.log(`Fraction of Pinned Dependencies: ${fractionPinned}`);

        // Return the calculated metric
        return {
            statusCode: 200,
            body: JSON.stringify({
                metric: "Pinned Dependencies",
                fractionPinned,
                score: fractionPinned,
            }),
        };
    } catch (error) {
        // Log and return errors
        console.error("Error calculating Pinned Dependencies Metric:", error.message);
        console.error("Full Error:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Error calculating Pinned Dependencies Metric",
                error: error.message,
            }),
        };
    }
};
