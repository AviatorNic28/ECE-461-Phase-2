/**
 * Code Review Metric Handler
 *
 * This AWS Lambda function calculates the fraction of merged pull requests that have been reviewed
 * in a given GitHub repository. The function ensures the output is normalized between 0 and 1.
 *
 * @function handler
 * @param {Object} event - The AWS Lambda event object containing the input request.
 * @param {string} event.body - JSON string containing the moduleName in the format "owner/repo".
 *
 * @returns {Object} - HTTP response object.
 * @property {number} statusCode - The HTTP status code of the response.
 * @property {Object} body - The JSON object containing the fraction of reviewed pull requests.
 *
 * @example Input:
 * {
 *   "body": "{\"moduleName\": \"facebook/react\"}"
 * }
 *
 * @example Output:
 * {
 *   "fractionReviewed": 0.6
 * }
 *
 * @throws {Error} - Throws an error if required parameters are missing or invalid, or if GitHub API calls fail.
 */

import axios from "axios";

export const handler = async (event) => {
  try {
    // Extract moduleName from event body
    const moduleName = event?.moduleName || JSON.parse(event?.body)?.moduleName;
    if (!moduleName) {
      throw new Error("Missing or invalid request body");
    }

    console.log(`Processing Code Review Metric for Package: ${moduleName}`);

    // Validate moduleName format
    const [owner, repo] = moduleName.split("/");
    if (!owner || !repo) {
      throw new Error("Invalid moduleName format. Expected 'owner/repo'.");
    }

    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

    // Step 1: Fetch recent pull requests
    const pullsResponse = await axios.get(`${baseUrl}/pulls`, {
      params: { state: "closed", sort: "updated", direction: "desc", per_page: 10 },
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "User-Agent": "AWS-Lambda",
      },
    });

    const pullRequests = pullsResponse.data;

    // Handle case where no pull requests are found
    if (!pullRequests.length) {
      console.log("No pull requests found for this repository.");
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No pull requests found.",
          fractionReviewed: 0,
        }),
      };
    }

    // Step 2: Fetch reviews for each pull request concurrently
    const reviewPromises = pullRequests.map(async (pr) => {
      // Skip unmerged pull requests
      if (!pr.merged_at) return false;

      try {
        const reviewsResponse = await axios.get(`${baseUrl}/pulls/${pr.number}/reviews`, {
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            "User-Agent": "AWS-Lambda",
          },
        });

        const reviews = reviewsResponse.data;

        // Check if any review is in the "APPROVED" state
        return reviews.some((review) => review.state === "APPROVED");
      } catch (error) {
        console.warn(`Failed to fetch reviews for PR #${pr.number}. Skipping.`);
        return false;
      }
    });

    const reviewResults = await Promise.all(reviewPromises);

    // Step 3: Calculate the fraction of reviewed pull requests
    const reviewedPRCount = reviewResults.filter(Boolean).length;
    const totalPRCount = reviewResults.length;
    let fractionReviewed = totalPRCount ? reviewedPRCount / totalPRCount : 0;

    // Ensure fractionReviewed is normalized between 0 and 1
    fractionReviewed = Math.min(1, Math.max(0, fractionReviewed.toFixed(4)));

    console.log(`Fraction of Reviewed Code: ${fractionReviewed}`);

    // Return the response
    return {
      statusCode: 200,
      body: JSON.stringify({
        fractionReviewed,
      }),
    };
  } catch (error) {
    console.error("Error calculating Code Review Metric:", error.message);
    console.error("Full Error:", error);

    // Handle errors gracefully
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error calculating Code Review Metric",
        error: error.message,
      }),
    };
  }
};
