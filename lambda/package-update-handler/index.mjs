import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3Client = new S3Client({});
const BUCKET_NAME = "ece461-trustworthy-module-registry";
const METADATA_TABLE = "ece461-module-metadata2";
const METRICS_TABLE = "MetricScoresTable";

export const handler = async (event) => {
    console.log('Received update event:', JSON.stringify(event, null, 2));

    try {
        const packageId = event.pathParameters?.id;
        let parsedBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { version, content } = parsedBody;

        console.log('Processing update for package:', packageId, 'version:', version);

        if (!packageId || !version || !content) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Missing required fields",
                    details: "Package ID, version, and content are required"
                })
            };
        }

        // Check if package exists in S3
        const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: `${packageId}.zip`
        });

        console.log('Checking for existing package in S3...');
        const listResponse = await s3Client.send(listCommand);

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    error: "Package not found",
                    details: "Package does not exist in storage"
                })
            };
        }

        // Convert base64 content to buffer
        const contentBuffer = Buffer.from(content, 'base64');

        // Update package in S3 (maintaining original filename)
        const s3Key = `${packageId}.zip`;
        const uploadCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: contentBuffer,
            ContentType: 'application/zip',
            Metadata: {
                'package-version': version,
                'last-updated': new Date().toISOString()
            }
        });

        console.log(`Updating package in S3: ${s3Key}`);
        await s3Client.send(uploadCommand);

        // Mark previous version as not latest in metadata
        const queryCommand = new QueryCommand({
            TableName: METADATA_TABLE,
            KeyConditionExpression: "packageName = :pkg",
            ExpressionAttributeValues: {
                ":pkg": packageId
            }
        });

        const existingVersions = await dynamodb.send(queryCommand);
        if (existingVersions.Items) {
            for (const item of existingVersions.Items) {
                if (item.isLatest) {
                    const updateCommand = new UpdateCommand({
                        TableName: METADATA_TABLE,
                        Key: {
                            packageName: packageId,
                            version: item.version
                        },
                        UpdateExpression: "set isLatest = :latest",
                        ExpressionAttributeValues: {
                            ":latest": false
                        }
                    });
                    await dynamodb.send(updateCommand);
                }
            }
        }

        // Update metadata with new version
        const metadata = {
            packageName: packageId,
            version: version,
            updatedAt: new Date().toISOString(),
            size: contentBuffer.length,
            isLatest: true
        };

        const updateMetadataCommand = new PutCommand({
            TableName: METADATA_TABLE,
            Item: metadata
        });

        console.log('Updating package metadata:', metadata);
        await dynamodb.send(updateMetadataCommand);

        // Update metrics table
        const metricsData = {
            moduleName: packageId,
            version: version,
            updatedAt: new Date().toISOString(),
            scores: {
                pending: true
            }
        };

        const updateMetricsCommand = new PutCommand({
            TableName: METRICS_TABLE,
            Item: metricsData
        });

        await dynamodb.send(updateMetricsCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Package updated successfully",
                packageName: packageId,
                version: version,
                size: contentBuffer.length,
                updatedAt: metadata.updatedAt
            })
        };

    } catch (error) {
        console.error('Error updating package:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Error updating package",
                details: error.message
            })
        };
    }
}
