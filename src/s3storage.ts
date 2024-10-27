import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from 'stream';

const s3Client = new S3Client({ region: "us-east-1" }); 
const bucketName = "ece461-trustworthy-module-registry"; 

export async function uploadFile(key: string, body: Buffer): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
  });

  try {
    await s3Client.send(command);
    console.log(`File uploaded successfully: ${key}`);
  } catch (err) {
    console.error(`Error uploading file: ${err}`);
    throw err;
  }
}

export async function downloadFile(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const response = await s3Client.send(command);
    const stream = response.Body as Readable;
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  } catch (err) {
    console.error(`Error downloading file: ${err}`);
    throw err;
  }
}