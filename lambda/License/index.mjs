/**
 * License Compatibility Metric Handler
 *
 * This AWS Lambda function evaluates the compatibility of a package's license
 * based on a predefined list of compatible licenses. The function first attempts
 * to retrieve the license from the GitHub repository, and if that fails, falls back
 * to the npm registry. If both attempts fail, it defaults to "NOASSERTION."
 *
 * Compatible licenses include widely accepted open-source licenses such as MIT,
 * Apache-2.0, and GPL variations.
 *
 * @function handler
 * @param {Object} event - The AWS Lambda event object containing the input request.
 * @param {string} event.body - JSON string containing the moduleName in the request.
 *
 * @returns {Object} - HTTP response object.
 * @property {number} statusCode - The HTTP status code of the response.
 * @property {Object} body - The JSON object containing the license compatibility metric.
 *
 * @example Input:
 * {
 *   "body": "{\"moduleName\": \"facebook/react\"}"
 * }
 *
 * @example Output:
 * {
 *   "metric": "License Compatibility",
 *   "license": "MIT",
 *   "score": 1.0
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

        console.log(`Processing License Compatibility Metric for Package: ${moduleName}`);

        // Default license value if no valid license is found
        let license = "NOASSERTION";

        // Step 1: Attempt to fetch the license using the GitHub API
        try {
            const githubResponse = await axios.get(`https://api.github.com/repos/${moduleName}/license`, {
                headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
            });
            license = githubResponse.data.license?.spdx_id || "NOASSERTION";
        } catch (githubError) {
            console.warn("GitHub API failed. Falling back to npm registry or raw LICENSE file.");
        }

        // Step 2: Fallback to fetching the license from the npm registry
        if (license === "NOASSERTION") {
            try {
                const npmResponse = await axios.get(`https://registry.npmjs.org/${moduleName}`);
                license = npmResponse.data.license || "NOASSERTION";
            } catch (npmError) {
                console.warn("NPM registry fallback also failed.");
            }
        }

        console.log(`License: ${license}`);

        // Step 3: Determine compatibility based on predefined list of compatible licenses
        const compatibleLicenses = [
            "MIT", "Apache-2.0", "ISC", "BSD-2-Clause", "BSD-3-Clause",
            "GPL-1.0-only", "GPL-1.0-or-later", "GPL-2.0-only", "GPL-2.0-or-later",
            "GPL-3.0-only", "GPL-3.0-or-later", "LGPL-2.1-only", "LGPL-2.1-or-later",
            "LGPL-3.0-only", "LGPL-3.0-or-later", "AGPL-3.0-only", "AGPL-3.0-or-later",
            "CC0-1.0", "MPL-2.0", "EPL-1.0", "EPL-2.0"
        ];

        const isCompatible = compatibleLicenses.includes(license);

        // Return the metric results
        return {
            statusCode: 200,
            body: JSON.stringify({
                metric: "License Compatibility",
                license,
                score: isCompatible ? 1.0 : 0.0, // Score is 1.0 if compatible, 0.0 otherwise
            }),
        };
    } catch (error) {
        console.error("Error calculating License Compatibility:", error.message);
        console.error("Full Error:", error);

        // Return a 500 error response in case of failure
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Error calculating License Compatibility",
                error: error.message,
            }),
        };
    }
};
