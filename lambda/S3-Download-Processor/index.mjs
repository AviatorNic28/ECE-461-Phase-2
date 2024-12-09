/**
 * <p>Lambda function to increment the download counter for a package in DynamoDB metadata.</p>
 * 
 * <p>This is the sister Download lambda function, which uses an EventBridge rule to
 * check for a successful download event from the S3 storage bucket. It then increments
 * the download counter within that specific package's metadata on the table in DynamoDB.</p>
 * 
 * <h3>Key Features:</h3>
 * <ul>
 *   <li>Processes S3 events of type <code>ObjectAccessed:Get</code>.</li>
 *   <li>Extracts the package name from the S3 object key.</li>
 *   <li>Increments the <code>Downloads</code> counter in the DynamoDB table for the corresponding package.</li>
 *   <li>Handles cases where the <code>Downloads</code> attribute does not yet exist, initializing it to <code>0</code>.</li>
 * </ul>
 * 
 * <h3>Notes:</h3>
 * <ul>
 *   <li>This function assumes that the EventBridge rule is correctly configured to trigger on
 *       <code>GetObject</code> events for the relevant S3 bucket. This way, it only
 *       increments the downloads if the operation was successful</li>
 *   <li>Error handling ensures that failures to update the database are logged for debugging.</li>
 * </ul>
 */

import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

//initialize the DynamoDB client
const dynamodb = new DynamoDBClient({ region: "us-east-1" });

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  //loop through each record in the event (in case of batch processing)
  for (const record of event.Records) {
    if (record.eventName === "ObjectAccessed:Get") {
      const bucketName = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
      console.log(`Processing download event for Bucket: ${bucketName}, Key: ${key}`);

      //extract the module name from the key
      const packageName = key.split('/').pop();

      //here is where we prepare the parameters for DynamoDB update
      const dbParams = {
        TableName: 'ece461-module-metadata2',
        Key: {
          packageName: { S: packageName }
        },
        UpdateExpression: "SET Downloads = if_not_exists(Downloads, :start) + :inc",
        ExpressionAttributeValues: {
          ":inc": { N: "1" },
          ":start": { N: "0" }
        },
        ReturnValues: "UPDATED_NEW"
      };

      try {
        //update the DynamoDB table to increment the Downloads counter by 1
        const result = await dynamodb.send(new UpdateItemCommand(dbParams));
        console.log("Successfully updated download count:", result);
      } catch (error) {
        console.error("Error updating download count:", error);
      }
    }
  }
};
