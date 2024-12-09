import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Lambda } from "@aws-sdk/client-lambda";
import https from 'https';

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3Client = new S3Client({});
const lambda = new Lambda({});
const BUCKET_NAME = "ece461-trustworthy-module-registry";
const METADATA_TABLE = "ece461-module-metadata2";
const METRICS_TABLE = "MetricScoresTable";

// Helper function to make HTTPS requests
const httpsRequest = (url, options = {}) => {
    return new Promise((resolve, reject) => {
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
};

export const handler = async (event) => {
    console.log('Received ingest event:', JSON.stringify(event, null, 2));

    try {
        const { url } = JSON.parse(event.body);
        if (!url) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "URL is required" })
            };
        }

        // Extract package name from npm URL
        const packageName = extractPackageName(url);
        if (!packageName) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid npm package URL" })
            };
        }

        // Get GitHub repository URL from npm
        const repoUrl = await getGitHubUrl(packageName);
        if (!repoUrl) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Could not find GitHub repository" })
            };
        }

        // Calculate metrics
        const metrics = await calculateMetrics(repoUrl);
        
        // Check if all metrics meet minimum threshold
        if (!meetsThreshold(metrics)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    error: "Package does not meet minimum trustworthiness requirements",
                    metrics 
                })
            };
        }

        // Download and store package
        const packageData = await downloadPackage(packageName);
        if (!packageData) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Failed to download package" })
            };
        }

        // Store package in S3
        const s3Key = `${packageName}.zip`;
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: packageData.content,
            ContentType: 'application/zip',
            Metadata: {
                'package-version': packageData.version
            }
        }));

        // Store metadata
        const metadata = {
            packageName,
            version: packageData.version,
            createdAt: new Date().toISOString(),
            size: packageData.content.length,
            gitHubUrl: repoUrl,
            isLatest: true
        };

        await dynamodb.send(new PutCommand({
            TableName: METADATA_TABLE,
            Item: metadata
        }));

        // Store metrics
        await dynamodb.send(new PutCommand({
            TableName: METRICS_TABLE,
            Item: {
                moduleName: packageName,
                version: packageData.version,
                scores: metrics,
                calculatedAt: new Date().toISOString()
            }
        }));

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Package ingested successfully",
                packageName,
                version: packageData.version,
                metrics
            })
        };

    } catch (error) {
        console.error('Error ingesting package:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Error ingesting package",
                details: error.message
            })
        };
    }
};

function extractPackageName(url) {
    const match = url.match(/npmjs\.com\/package\/([^\/]+)/);
    return match ? match[1] : null;
}

async function calculateMetrics(repoUrl) {
    const metricsLambdas = {
        rampup: 'rampup-time',
        busfactor: 'busfactor',
        correctness: 'correctness',
        responsiveness: 'responsiveness',
        license: 'License',
        dependencies: 'dependencies-pinned',
        codeReview: 'code-review'
    };

    const metricResults = {};

    // Process metrics in parallel
    const metricPromises = Object.entries(metricsLambdas).map(async ([metric, functionName]) => {
        try {
            console.log(`Starting ${metric} calculation for ${repoUrl}`);
            
            const params = {
                FunctionName: functionName,
                Payload: JSON.stringify({
                    body: JSON.stringify({
                        moduleName: repoUrl
                    })
                })
            };
            
            console.log(`${metric} invoke params:`, JSON.stringify(params));
            const response = await lambda.invoke(params);
            console.log(`${metric} raw response:`, JSON.stringify(response));

            if (response.FunctionError) {
                console.error(`${metric} function error:`, response.FunctionError);
                return [metric, 0];
            }

            const payload = Buffer.from(response.Payload).toString();
            console.log(`${metric} payload:`, payload);

            let score = 0;
            try {
                const parsedPayload = JSON.parse(payload);
                console.log(`${metric} parsed payload:`, JSON.parse(payload));
                
                if (parsedPayload.body) {
                    const body = JSON.parse(parsedPayload.body);
                    console.log(`${metric} parsed body:`, body);
                    
                    if (body.score !== undefined) {
                        score = body.score;
                    } else if (body.fractionReviewed !== undefined) {
                        score = body.fractionReviewed;
                    }
                }
            } catch (parseError) {
                console.error(`${metric} parse error:`, parseError);
            }

            console.log(`Final ${metric} score:`, score);
            return [metric, score];
        } catch (error) {
            console.error(`Error calculating ${metric}:`, error);
            return [metric, 0];
        }
    });

    try {
        const results = await Promise.all(metricPromises);
        results.forEach(([metric, score]) => {
            metricResults[metric] = score || 0;
        });
    } catch (error) {
        console.error('Error processing metric results:', error);
    }

    console.log('Final metric results:', metricResults);
    return metricResults;
}

async function getGitHubUrl(packageName) {
    try {
        console.log('Fetching npm registry data for:', packageName);
        const response = await new Promise((resolve, reject) => {
            https.get(`https://registry.npmjs.org/${packageName}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(error);
                    }
                });
                res.on('error', reject);
            }).on('error', reject);
        });

        console.log('NPM registry response repository:', response.repository);
        
        if (response.repository) {
            let repoUrl = response.repository.url || '';
            // Handle git+https:// prefix
            repoUrl = repoUrl.replace('git+https://github.com/', '');
            repoUrl = repoUrl.replace('https://github.com/', '');
            repoUrl = repoUrl.replace('.git', '');
            
            console.log('Cleaned GitHub URL:', repoUrl);
            return repoUrl;
        }
        return null;
    } catch (error) {
        console.error('Error fetching package info:', error);
        return null;
    }
}

function meetsThreshold(metrics) {
    return Object.values(metrics).every(score => score >= 0.5);
}

async function downloadPackage(packageName) {
    try {
        const npmData = await httpsRequest(`https://registry.npmjs.org/${packageName}/latest`);
        const version = npmData.version;
        const tarballUrl = npmData.dist.tarball;
        
        const tarballData = await httpsRequest(tarballUrl);
        
        return {
            version,
            content: Buffer.from(tarballData)
        };
    } catch (error) {
        console.error('Error downloading package:', error);
        return null;
    }
}
