import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

const METADATA_TABLE = "ece461-module-metadata2";
const METRICS_TABLE = "MetricScoresTable";
const BUCKET_NAME = "ece461-trustworthy-module-registry";

export const handler = async (event) => {
    console.log("Received reset event:", JSON.stringify(event));

    try {
        // 1. Clear the Metadata Table
        await clearDynamoTable(METADATA_TABLE, ['packageName', 'version']);

        // 2. Clear the Metrics Table
        //await clearDynamoTable(METRICS_TABLE, ['moduleName', 'version']);

        // 3. Clear S3 Bucket Objects
        //await clearS3Bucket(BUCKET_NAME);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "System reset to default state successfully" })
        };
    } catch (error) {
        console.error("Error resetting system:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to reset system", details: error.message })
        };
    }
};

async function clearDynamoTable(tableName, keyAttributes) {
    let lastEvaluatedKey = undefined;
    do {
        const scanParams = {
            TableName: tableName,
            ExclusiveStartKey: lastEvaluatedKey
        };
        const response = await docClient.send(new ScanCommand(scanParams));
        const { Items, LastEvaluatedKey } = response;

        if (Items) {
            // Delete each item
            for (const item of Items) {
                const key = {};
                for (const attr of keyAttributes) {
                    key[attr] = item[attr];
                }
                await docClient.send(new DeleteCommand({
                    TableName: tableName,
                    Key: key
                }));
            }
        }

        lastEvaluatedKey = LastEvaluatedKey;
    } while (lastEvaluatedKey);
}

async function clearS3Bucket(bucketName) {
    let continuationToken = undefined;
    do {
        const listParams = {
            Bucket: bucketName,
            ContinuationToken: continuationToken
        };
        const listResponse = await s3Client.send(new ListObjectsV2Command(listParams));

        if (listResponse.Contents) {
            for (const obj of listResponse.Contents) {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: bucketName,
                    Key: obj.Key
                }));
            }
        }

        continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);
}
