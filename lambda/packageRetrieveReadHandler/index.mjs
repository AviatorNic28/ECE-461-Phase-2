import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = "ece461-module-metadata2";

export const handler = async (event) => {
    console.log("Received event:", JSON.stringify(event));

    try {
        const params = event.queryStringParameters || {};
        const query = params.query ? params.query.toLowerCase() : null;

        let items = [];
        let lastEvaluatedKey = undefined;

        do {
            const scanParams = {
                TableName: TABLE_NAME,
                ExclusiveStartKey: lastEvaluatedKey
            };

            const response = await docClient.send(new ScanCommand(scanParams));
            const allItems = response.Items || [];

            if (query) {
                const filtered = allItems.filter(item =>
                    item.PackageName && item.PackageName.toLowerCase().includes(query)
                );
                items = items.concat(filtered);
            } else {
                items = items.concat(allItems);
            }

            lastEvaluatedKey = response.LastEvaluatedKey;
        } while (lastEvaluatedKey);

        return {
            statusCode: 200,
            body: JSON.stringify({ count: items.length, packages: items })
        };

    } catch (error) {
        console.error("Error listing packages:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error listing packages", error: error.message })
        };
    }
};
