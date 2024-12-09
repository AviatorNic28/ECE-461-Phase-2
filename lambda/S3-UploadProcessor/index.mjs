/**
 * AWS Lambda function to process S3 events and update metadata in DynamoDB.
 *
 * <p>This function is triggered by a successful upload event to the S3 bucket. It extracts the metadata
 * from the S3 event record, such as the key, and gets all the information necessary to fill out a comprehensive 
 * metadata table on dynamoDB. Included in the sent key from the presignedURL is moduleName, file name and type, and the rating
 * It formats all information for the table, and sends it, with statusCodes for how that went.
 *
 * <h2>Features:</h2>
 * <ul>
 *   <li>Processes S3 upload events from a configured bucket.</li>
 *   <li>Parses S3 object keys to extract metadata (module name, file name, file type, and rating).</li>
 *   <li>Updates DynamoDB table with parsed metadata, including upload timestamp and instantiates the download count.</li>
 * </ul>
 *
 * <h2>Environment Variables:</h2>
 * <ul>
 *   <li><code>TableName</code> - This is the Name of the DynamoDB table for storing metadata.</li>
 * </ul>
 *
 * @param {Object} event - The AWS Lambda event object, containing S3 event details.
 * <ul>
 *   <li><code>event.Records</code> - An array of S3 event records triggered by file uploads.</li>
 *   <li><code>event.Records[0].s3.bucket.name</code> - The name of the S3 bucket where the file was uploaded.</li>
 *   <li><code>event.Records[0].s3.object.key</code> - The key (file path) of the uploaded object. includes a lot of metadata</li>
 * </ul>
 *
 * @returns {Object} - The HTTP response object:
 * <ul>
 *   <li><code>statusCode</code> - 200 on success, 500 on error.</li>
 *   <li><code>body</code> - A JSON string containing a success or error message.</li>
 * </ul>
 *
 * @throws {Error} - If DynamoDB operations fail or the event structure is invalid.
 *
 * <h2>Debugging Notes:</h2>
 * Debugging logs (marked as "debugging | remove for final version") are included throughout the
 * function. These should be removed in production for better performance and security. 
 * There is an included Message to other members of the team preserved at the bottom for 
 * graders to see team integration communication
 */

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"; //Import DynamoDB client instead of full aws-sdk

const dynamodb = new DynamoDBClient({});  // Instantiate DynamoDB client

export const handler = async (event) => {
    try {
        //debugging log, remove on final vers
        console.log("Incoming Event:", JSON.stringify(event, null, 2));

        // Loop through the S3 event records, to get the information from the latest upload event (which triggers this function)
        for (const record of event.Records) {
            const bucket = record.s3.bucket.name; //these are like pointers to specific info, automatically grabs the latest shit
            const key = record.s3.object.key;

            //debugging log to check the data being passed into the params, remove on final vers
            //console.log(`Processing S3 Event for Bucket: ${bucket}, Key: ${key}`);
            
            //new, added for name exceptions
            const [moduleName, fileName, fileType, rating] = key.split('/');

            //debug log to check the extracted names from the key
            // console.log(`Extracted Module Name: ${moduleName}`);
            // console.log(`Extracted File Name: ${fileName}`);
            // console.log(`Extracted File Type: ${fileType}`);
            // console.log(`Extracted Rating: ${rating}`);

            //this block prepares metadata for DynamoDB update
            //currently formatted to pass into the "Test" table in dynamoDB
            const dbParams = {
                TableName: 'ece461-module-metadata2',
                Item: {
                    packageName: { S: moduleName }, // this is the partition key for the table, currently set to moduleName
                    version: { S: "1.0.0" }, //sort key, might get patched out
                    Downloads: { N: "0" }, // Initial download count
                    fileName: { S: fileName }, //store file name
                    fileType: { S: fileType }, //store file type
                    UploadedAt: { S: new Date().toISOString() }, // Record timestamp
                    Rating: { N: rating } // store passed in rating 
                    
                }
            };

            //logging the formatted DynamoDB parameters -- debugging | remove for final vers
            // console.log("DynamoDB Parameters:", JSON.stringify(dbParams, null, 2));

            //update DynamoDB with package metadata (formatted above)
            await dynamodb.send(new PutItemCommand(dbParams));

            //log success after DynamoDB put operation -- debugging | remove for final vers
            // console.log("DynamoDB PutItem Operation Successful");
        }

        //return success response
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Metadata updated successfully' })
        };
    } catch (error) {
        //handle errors and return a response
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error updating metadata', error: error.message })
        };
    }
};



/* Sayim and whoever else needs to look at this. This function ACTIVATES 
upon a successful upload straight to a specified S3 bucket. Basically, the actual 
event of a file getting into the bucket is a trigger for this function to start.

Once it starts, it loops through the logs off the S3 bucket event, and collects data
to send to the DynamoDB database. It collects stuff from the built in cloudwatch and s3 logs, 
but also from any info files included in the package. It can collect stuff like package name, 
metric scores, user authorization, whatever we include in the actual file transfer. It's likely 
limited to information transfered and logged by the event, but that can be more than enough.

After collecting all that data through loops and stuff, it puts all that data together in 
a formatted way to send to the dynamoDB tables. It packages it up and automatically sends it 
to whatever DynamoDB location we want to specify. 

After it does all this, it just simply sends a response to the source of the request saying 
the metadata was updated successfully. 

Again, this code is currently triggered by a SUCCESSFUL UPLOAD to the main S3 storage bucket. 

Feel free to message if you have any questions.
*/