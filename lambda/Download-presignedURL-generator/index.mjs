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
 *     <li><code>moduleName</code> - Name of the module to download, referenced against the metadata table for download.</li>
 *   </ul>
 *   <li>Generates a presigned URL for downloading the specified module package.</li>
 *   <li>Sets the URL expiration time to 10 minutes (600 seconds).</li>
 * </ul>
 * 
 * <h3>Request:</h3>
 * <ul>
 *   <li><strong>Method:</strong> POST</li>
 *   <li><strong>Body:</strong> JSON object containing:
 *     <ul>
 *       <li><code>moduleName</code> - Name of the module (string).</li>
 *     </ul>
 *   </li>
 * </ul>
 * 
 * <h3>Response:</h3>
 * <ul>
 *   <li><strong>200 OK:</strong> JSON object containing the presigned URL.</li>
 *   <ul>
 *     <li><code>{"downloadURL": "<Presigned_URL_here>"}</code></li>
 *   </ul>
 *   <li><strong>403 Unauthorized:</strong> JSON object indicating the user is not authorized.</li>
 *   <ul>
 *     <li><code>{"message": "Unauthorized"}</code></li>
 *   </ul>
 *   <li><strong>500 Internal Server Error:</strong> JSON object containing the error message.</li>
 *   <ul>
 *     <li><code>{"message": "Error generating presigned URL", "error": "<error details>"}</code></li>
 *   </ul>
 * </ul>
 * 
 * <h3>Notes:</h3>
 * <ul>
 *   <li>This function only generates the presigned URL for direct download. Actual metadata updates are handled by the 
 *   <code>S3-Download-Processor</code> Lambda function to increment the download counter on the table.</li>
 *   <li>Architecture for an X-Authorization user authentication system is still included but bypassed as we never completed it. </li>
 *   <li> debug notes and internal messages still included and preserved for grading purposes. </li>
 * </ul>
 */

import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3"; //import specific modules instead of full sdk

const s3Client = new S3Client({ region: "us-east-1" }); //instantiate the S3 service here

export const handler = async (event) => {
    try {
        //extract the access token from headers, this will be important later
        const authHeader = event.headers['X-Authorization'];

        //here we validate the access token (placeholder function, to be implemented)
        if (!validateAccessToken(authHeader)) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Unauthorized' })
            };
        } //end of placeholder authorization section
        
        /*--- TO ALEX ---
        The input for the body of the download request should just be the moduleName 
        as we've set that to be the partition key for the metadata that points to 
        the module's package.    -----> moduleName <-----  
        */

        //the full moduleName should be included in the request body, so that the code knows which package to grab
        const { moduleName } = JSON.parse(event.body);

        //define the parameters for S3 GetObject (grabbing the package)
        const s3Params = {
            Bucket: 'ece461-trustworthy-module-registry', //our S3 bucket name
            Key: moduleName, //module name provided by the front end
        };

        const command = new GetObjectCommand(s3Params);

        //generate the presigned URL for download
        const downloadURL = await getSignedUrl(s3Client, command, { expiresIn: 600 }); //currently set so URL expires in 10 minutes

        //return the presigned URL
        return {
            statusCode: 200,
            body: JSON.stringify({ downloadURL }),
        };
    } catch (error) {
        //handle errors and return a response
        console.error("Error generating presigned URL:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error generating presigned URL', error: error.message }),
        };
    }
};


// Placeholder function for validating the access token
const validateAccessToken = (token) => {
  // Placeholder - add validation logic when implementing Access Control Track
  return true; // For now, assume all requests are authorized
};