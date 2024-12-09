/**
 * Rating Handler
 *
 * This AWS Lambda function calculates and updates the rating for a given package using its packageId.
 * It retrieves the package's metadata, computes individual metric scores using other Lambda functions,
 * calculates an aggregate score (normalized between 0 and 1), and updates two DynamoDB tables:
 * - `MetricScoresTable`: Stores individual metric scores for the package.
 * - `ece461-module-metadata2`: Stores the aggregate rating and metadata for the package.
 *
 * @function handler
 * @param {Object} event - The AWS Lambda event object containing the input request.
 * @param {Object} event.pathParameters - Contains the `packageId` of the package to rate.
 *
 * @returns {Object} - HTTP response object.
 * @property {number} statusCode - The HTTP status code of the response.
 * @property {Object} body - The JSON object containing the package details, scores, and net score.
 *
 * @example Input:
 * {
 *   "pathParameters": {
 *     "packageId": "123456789"
 *   }
 * }
 *
 * @example Output:
 * {
 *   "packageId": "123456789",
 *   "packageName": "facebook/react",
 *   "version": "1.0.0",
 *   "scores": {
 *     "rampup": 0.8,
 *     "busfactor": 0.9,
 *     "responsiveness": 0.7,
 *     ...
 *   },
 *   "netScore": 0.8
 * }
 *
 * @throws {Error} - Throws an error if required parameters are missing, or if there is an issue with database or Lambda invocations.
 */

import AWS from 'aws-sdk';
import axios from 'axios';

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

// Table Names
const PACKAGE_METADATA_TABLE = 'PackageMetadataTable';
const METRIC_SCORES_TABLE = 'MetricScoresTable';
const MODULE_METADATA_TABLE = 'ece461-module-metadata2';

// Metric Lambdas and Weights
const METRIC_LAMBDAS = {
    rampup: 'arn:aws:lambda:us-east-1:216989128304:function:rampup-time',
    busfactor: 'arn:aws:lambda:us-east-1:216989128304:function:busfactor',
    responsiveness: 'arn:aws:lambda:us-east-1:216989128304:function:responsiveness',
    license: 'arn:aws:lambda:us-east-1:216989128304:function:License',
    codeReview: 'arn:aws:lambda:us-east-1:216989128304:function:code-review',
    pinnedDependencies: 'arn:aws:lambda:us-east-1:216989128304:function:dependencies-pinned',
    correctness: 'arn:aws:lambda:us-east-1:216989128304:function:correctness',
};

const WEIGHTS = {
    rampup: 0.15,
    busfactor: 0.15,
    responsiveness: 0.2,
    license: 0.15,
    codeReview: 0.1,
    pinnedDependencies: 0.1,
    correctness: 0.15,
};

// Helper to invoke metric Lambdas
async function invokeMetricLambda(functionName, payload) {
    try {
        const response = await lambda.invoke({
            FunctionName: functionName,
            Payload: JSON.stringify(payload),
        }).promise();

        const parsedPayload = JSON.parse(response.Payload || '{}');
        if (parsedPayload.errorMessage) {
            console.error(`Error in ${functionName}:`, parsedPayload.errorMessage);
            return 0;
        }

        const responseBody = JSON.parse(parsedPayload.body || '{}');
        return responseBody.score || 0;
    } catch (error) {
        console.error(`Error invoking Lambda ${functionName}:`, error);
        return 0;
    }
}

export const handler = async (event) => {
    // Extract packageId from path parameters
    const packageId = event.pathParameters?.packageId;

    if (!packageId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing packageId' }),
        };
    }

    // Step 1: Query PackageMetadataTable for packageName and version
    let packageData;
    try {
        const result = await dynamodb.get({
            TableName: PACKAGE_METADATA_TABLE,
            Key: { packageId },
        }).promise();

        packageData = result.Item;
        if (!packageData) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: `Package with id ${packageId} not found` }),
            };
        }
    } catch (error) {
        console.error('Error querying PackageMetadataTable:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error querying PackageMetadataTable', error }),
        };
    }

    const { packageName, version } = packageData;

    // Step 2: Calculate scores for the package
    const payload = { moduleName: packageName };
    const metricScores = {};

    for (const [metric, functionName] of Object.entries(METRIC_LAMBDAS)) {
        metricScores[metric] = await invokeMetricLambda(functionName, payload);
    }

    console.log('Metric Scores:', metricScores);

    // Calculate normalized net score
    let netScore = Object.entries(metricScores).reduce((acc, [metric, score]) => {
        return acc + score * (WEIGHTS[metric] || 0);
    }, 0);

    // Normalize netScore to [0, 1]
    netScore = Math.min(1, Math.max(0, netScore.toFixed(4)));
    console.log('Normalized NetScore:', netScore);

    // Step 3: Update MetricScoresTable
    try {
        await dynamodb.put({
            TableName: METRIC_SCORES_TABLE,
            Item: {
                packageId,
                scores: metricScores,
                updatedAt: new Date().toISOString(),
            },
        }).promise();
    } catch (error) {
        console.error('Error updating MetricScoresTable:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error updating MetricScoresTable', error }),
        };
    }

    // Step 4: Update ece461-module-metadata2 Table
    try {
        await dynamodb.update({
            TableName: MODULE_METADATA_TABLE,
            Key: { packageName, version },
            UpdateExpression: 'SET Rating = :rating, UpdatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':rating': netScore,
                ':updatedAt': new Date().toISOString(),
            },
        }).promise();
    } catch (error) {
        console.error('Error updating MODULE_METADATA_TABLE:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error updating MODULE_METADATA_TABLE', error }),
        };
    }

    // Step 5: Return response as per OpenAPI spec
    return {
        statusCode: 200,
        body: JSON.stringify({
            packageId,
            packageName,
            version,
            scores: metricScores,
            netScore,
        }),
    };
};
