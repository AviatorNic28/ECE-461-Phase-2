/**
 * Correctness Metric Handler
 *
 * This AWS Lambda function evaluates the correctness of a package by analyzing the 
 * presence of tests and the extent of testing within the repository. The correctness
 * is measured by examining test-related files and calculating a correctness score
 * normalized between 0 and 1.
 *
 * @function handler
 * @param {Object} event - The AWS Lambda event object containing the input request.
 * @param {string} event.body - JSON string containing the moduleName in the request.
 *
 * @returns {Object} - HTTP response object.
 * @property {number} statusCode - The HTTP status code of the response.
 * @property {Object} body - The JSON object containing the correctness metric.
 *
 * @example Input:
 * {
 *   "body": "{\"moduleName\": \"facebook/react\"}"
 * }
 *
 * @example Output:
 * {
 *   "metric": "Correctness",
 *   "score": 0.5,
 *   "message": "Test coverage analyzed successfully"
 * }
 *
 * @throws {Error} - Throws an error if required parameters are missing or invalid,
 * or if external API calls fail.
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

        console.log(`Processing Correctness Metric for Package: ${moduleName}`);

        // Step 1: Fetch the default branch of the repository
        const branchResponse = await axios.get(`https://api.github.com/repos/${moduleName}`, {
            headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
        });

        const defaultBranch = branchResponse.data.default_branch || "main";
        console.log(`Default branch for ${moduleName} is ${defaultBranch}`);

        // Step 2: Fetch the file tree from the default branch
        const treeResponse = await axios.get(
            `https://api.github.com/repos/${moduleName}/git/trees/${defaultBranch}?recursive=1`,
            {
                headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
            }
        );

        const files = treeResponse.data.tree || [];
        console.log(`Total files found in repository: ${files.length}`);

        // Step 3: Identify test-related files
        const testFiles = files.filter(file => 
            file.path.includes("test") || file.path.includes("__tests__")
        );

        console.log(`Number of test-related files found: ${testFiles.length}`);

        // Step 4: Calculate the correctness score
        const totalFiles = files.length;
        const correctnessScore = totalFiles > 0 
            ? Math.min(testFiles.length / totalFiles, 1) // Normalize score to max 1
            : 0;

        console.log(`Correctness Score: ${correctnessScore}`);

        // Return the metric results
        return {
            statusCode: 200,
            body: JSON.stringify({
                metric: "Correctness",
                score: correctnessScore,
                message: "Correctness metric calculated successfully",
            }),
        };
    } catch (error) {
        console.error("Error calculating Correctness Metric:", error.message);
        console.error("Full Error:", error);

        // Return a 500 error response in case of failure
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Error calculating Correctness Metric",
                error: error.message,
            }),
        };
    }
};
