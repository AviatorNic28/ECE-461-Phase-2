/**
 * <p>Lambda function to generate a presigned URL for direct file uploads to an S3 bucket.</p>
 * 
 * <p>This function takes in a valid request format and generates a temporary presigned URL that
 * allows the front end to directly upload packages and modules to the S3 storage bucket. This 
 * was done to mitigate file corruption and improve system security, both of which it has 
 * succeeded in doing. 
 * 
 * <h3>Key Features:</h3>
 * <ul>
 *   <li>Parses the request body to extract file metadata, including:</li>
 *   <ul>
 *     <li><code>moduleName</code> - Name of the module to associate with the upload.</li>
 *     <li><code>fileName</code> - The name of the file being uploaded.</li>
 *     <li><code>fileType</code> - the filetype of the package being uploaded.</li>
 *     <li><code>rating</code> - A rating associated with the module (for metadata).</li>
 *   </ul>
 *   <li>Generates a presigned URL for uploading to S3.</li>
 *   <li>Configures S3 object permissions and metadata with the presigned URL.</li>
 *   <li>Sets the URL expiration time to 10 minutes (600 seconds).</li>
 * </ul>
 * 
 * <h3>Request:</h3>
 * <ul>
 *   <li><strong>Method:</strong> POST</li>
 *   <li><strong>Body:</strong> JSON object containing:
 *     <ul>
 *       <li><code>moduleName</code> - Name of the module (string).</li>
 *       <li><code>fileName</code> - File name (string).</li>
 *       <li><code>fileType</code> - MIME type of the file (string).</li>
 *       <li><code>rating</code> - Rating (number).</li>
 *     </ul>
 *   </li>
 * </ul>
 * 
 * <h3>Response:</h3>
 * <ul>
 *   <li><strong>200 OK:</strong> JSON object containing the presigned URL.</li>
 *   <ul>
 *     <li><code>{"uploadURL": "<Presigned_URL_here>"}</code></li>
 *   </ul>
 *   <li><strong>500 Internal Server Error:</strong> JSON object containing the error message.</li>
 *   <ul>
 *     <li><code>{"message": "Error generating presigned URL", "error": "<error details>"}</code></li>
 *   </ul>
 * </ul>
 * 
 * <h3>Notes:</h3>
 * <ul>
 *   <li>This function only generates the presigned URL. Actual metadata updates are handled by the 
 *   <code>S3-UploadProcessor</code> Lambda function after the upload is completed.</li>
 *   <li>Architecture for an X-Authorization user authentication system is still included
 *      but bypassed as we never completed it. </li>
 *   <li> debug notes and internal messages still included and preserved for grading purposes. </li>
 * </ul>
 */

import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3"; //changed from previous version to import only specific modules


const s3Client = new S3Client({ region: "us-east-1" }); //this is where we instantiate the S3 service

export const handler = async (event) => {
    try {
        
        const { moduleName, fileName, fileType, rating } = JSON.parse(event.body); //extract file details from request body
        
        const s3Params = {
            Bucket: 'ece461-trustworthy-module-registry', // possibly need to switch to front-end based on use case
            Key: `${moduleName}/${fileName}/${fileType}/${rating}`, // formatted key to pass all metadata to the UploadProcessor for storing on dynamo
            ContentType: fileType, // The content type of the file being uploaded
            ACL: 'bucket-owner-full-control', // Permission for S3 bucket owner
        };

        const command = new PutObjectCommand(s3Params); //new line added : puts the S3 params onto an object which we are passing

        // Get the presigned URL for upload
        const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 600 }); //URL expires in 10 minutes (600 seconds)
        //const uploadURL = await s3.getSignedUrlPromise('putObject', s3Params); //old vers

        // Return the presigned URL
        return {
            statusCode: 200,
            body: JSON.stringify({ uploadURL }),
        };
    } catch (error) {
        // Handle errors and return a response
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error generating presigned URL', error: error.message }),
        };
    }
};


/* Guys if you're looking at this code, this is generating a Presigned URL for A direct upload
of a file into S3, the URL and permissions automatically handle the transfer of data. This is basically 
giving a user temporary access to the S3 bucket to upload their file. This way, we're not streaming 
data through Lambda. This is not only faster, but it wont have the files corrupt during upload.

The second new function "S3-UploadProcessor" basically handles the aftermath of the upload, marking
it's metadata, notifying the backend, and logging the event. We can also introduce a security step that takes 
credentials before we give out this Presigned URL.  

Alex this needs to have some integration with your front-end, calling this function to give 
the users access to uploading and downloading. Call me if you read this or send a text*/