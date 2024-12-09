import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3Client = new S3Client({});
const BUCKET_NAME = "ece461-trustworthy-module-registry";
const METADATA_TABLE = "ece461-module-metadata2";

export const handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    try {
        const packageId = event.pathParameters?.id;
        if (!packageId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Package ID is required" })
            };
        }

        // Check for metadata
        const metadataQuery = new QueryCommand({
            TableName: METADATA_TABLE,
            KeyConditionExpression: "packageName = :pkg",
            ExpressionAttributeValues: {
                ":pkg": packageId
            }
        });

        console.log('Querying metadata for package:', packageId);
        const metadataResponse = await dynamodb.send(metadataQuery);
        console.log('Metadata response:', JSON.stringify(metadataResponse, null, 2));
        
        // Look for the package file in S3
        const directZipCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: packageId
        });

        console.log('Checking S3 for package files');
        const directZipResponse = await s3Client.send(directZipCommand);
        console.log('S3 response:', JSON.stringify(directZipResponse, null, 2));

        let packageSize = 0;

        // Process all .zip files found
        if (directZipResponse.Contents) {
            packageSize = directZipResponse.Contents.reduce((total, obj) => {
                if (obj.Key?.endsWith('.zip')) {
                    console.log(`Found zip file: ${obj.Key} with size: ${obj.Size} bytes`);
                    return total + (obj.Size || 0);
                }
                return total;
            }, 0);
        }

        console.log(`Total package size: ${packageSize} bytes`);

        // If no package found
        if ((!metadataResponse.Items || metadataResponse.Items.length === 0) && packageSize === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "Package not found" })
            };
        }

        // Convert bytes to MB and format response
        const sizeInMB = packageSize / (1024 * 1024);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                packageName: packageId,
                size: sizeInMB.toFixed(2) + " MB",
                cost: sizeInMB.toFixed(2)
            })
        };

    } catch (error) {
        console.error('Error calculating package cost:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: "Error calculating package cost",
                details: error.message
            })
        };
    }
}