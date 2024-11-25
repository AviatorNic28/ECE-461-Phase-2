import { putItem, getItem } from './dynamoDbStorage';
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";


async function testConnection() {
    try {
        // Test storing an item
        const testItem = {
            packageName: "test-package",
            version: "1.0.0",
            uploadDate: new Date().toISOString()
        };

        console.log("Testing DynamoDB connection...");
        
        // Try to store item
        await putItem(testItem);
        console.log("Successfully stored test item");

        // Try to retrieve item
        const retrieved = await getItem({
            packageName: "test-package",
            version: "1.0.0"
        });
        console.log("Retrieved item:", retrieved);

    } catch (error) {
        console.error("Failed to connect to DynamoDB:", error);
        throw error;
    }
}

// Run the test
testConnection()
    .then(() => console.log("Test completed successfully"))
    .catch(error => console.error("Test failed:", error));
