import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand,
  ScanCommand,
  DeleteCommand,
  PutCommandInput,
  GetCommandInput,
  QueryCommandInput,
  ScanCommandInput
} from "@aws-sdk/lib-dynamodb";
import semver from 'semver';

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);
const tableName = "ece461-module-metadata2";

export interface DynamoDBItem {
  [key: string]: any;
}

export interface PackageMetadata extends DynamoDBItem {
  packageName: string;
  version: string;
  uploadDate: string;
  uploadedBy?: string;
  githubUrl?: string;
  metrics?: {
    netScore: number;
    rampUp: number;
    correctness: number;
    busFactor: number;
    responsiveMaintainer: number;
    license: number;
    dependencyPinning?: number;
    pullRequestQuality?: number;
  };
  readme?: string;
  size?: number;
  dependencies?: string[];
}

// Existing functions
export async function putItem(item: DynamoDBItem): Promise<void> {
  const params: PutCommandInput = {
    TableName: tableName,
    Item: item,
  };
  
  const command = new PutCommand(params);
  try {
    await docClient.send(command);
    console.log(`Item added successfully: ${JSON.stringify(item)}`);
  } catch (err) {
    console.error(`Error adding item: ${err}`);
    throw err;
  }
}

export async function getItem(key: DynamoDBItem): Promise<DynamoDBItem | null> {
  const params: GetCommandInput = {
    TableName: tableName,
    Key: key,
  };
  
  const command = new GetCommand(params);
  try {
    const response = await docClient.send(command);
    return response.Item || null;
  } catch (err) {
    console.error(`Error getting item: ${err}`);
    throw err;
  }
}

export async function queryItems(
  keyConditionExpression: string,
  expressionAttributeValues: DynamoDBItem
): Promise<DynamoDBItem[]> {
  const params: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };
  
  const command = new QueryCommand(params);
  try {
    const response = await docClient.send(command);
    return response.Items || [];
  } catch (err) {
    console.error(`Error querying items: ${err}`);
    throw err;
  }
}

// New package-specific functions
export async function storePackage(metadata: PackageMetadata): Promise<void> {
  await putItem({
    ...metadata,
    uploadDate: new Date().toISOString()
  });
}

export async function getPackage(packageName: string, version: string): Promise<PackageMetadata | null> {
  const result = await getItem({
    packageName,
    version
  });
  return result as PackageMetadata | null;
}

export async function getAllPackages(limit: number = 100, lastEvaluatedKey?: any): Promise<{
  packages: PackageMetadata[];
  lastEvaluatedKey?: any;
}> {
  const params: ScanCommandInput = {
    TableName: tableName,
    Limit: limit,
    ExclusiveStartKey: lastEvaluatedKey
  };

  try {
    const response = await docClient.send(new ScanCommand(params));
    return {
      packages: response.Items as PackageMetadata[],
      lastEvaluatedKey: response.LastEvaluatedKey
    };
  } catch (err) {
    console.error(`Error getting all packages: ${err}`);
    throw err;
  }
}

export async function searchPackages(searchTerm: string): Promise<PackageMetadata[]> {
  const searchPattern = searchTerm.toLowerCase();
  
  // Using existing queryItems function with a filter expression
  const results = await queryItems(
    'contains(lower(packageName), :term) OR contains(lower(readme), :term)',
    { ':term': searchPattern }
  );
  
  return results as PackageMetadata[];
}

export async function resetRegistry(): Promise<void> {
  try {
    const { packages } = await getAllPackages(1000);
    
    // Delete each package using existing putItem function
    for (const pkg of packages) {
      await docClient.send(new DeleteCommand({
        TableName: tableName,
        Key: {
          packageName: pkg.packageName,
          version: pkg.version
        }
      }));
    }
    
    console.log('Registry reset successfully');
  } catch (err) {
    console.error(`Error resetting registry: ${err}`);
    throw err;
  }
}

function filterVersionsByRange(versions: PackageMetadata[], range: string): PackageMetadata[] {
    // Handle exact version match
    if (semver.valid(range)) {
      return versions.filter(pkg => pkg.version === range);
    }
  
    // Handle bounded range (e.g., "1.2.3-2.1.0")
    if (range.includes('-')) {
      const [start, end] = range.split('-');
      if (semver.valid(start) && semver.valid(end)) {
        return versions.filter(pkg => 
          semver.gte(pkg.version, start) && semver.lte(pkg.version, end)
        );
      }
    }
  
    // Handle tilde ranges (~) - patch-level changes if minor version is specified
    if (range.startsWith('~')) {
      const version = range.slice(1);
      if (semver.valid(version)) {
        const parsed = semver.parse(version);
        if (parsed) {
          // ~1.2.3 := >=1.2.3 <1.3.0
          // ~1.2 := >=1.2.0 <1.3.0
          // ~1 := >=1.0.0 <2.0.0
          const minVersion = version;
          let maxVersion: string;
          
          if (parsed.minor === null) {
            const incVersion = semver.inc(version, 'major');
            maxVersion = incVersion !== null ? incVersion : version;
          } else {
            maxVersion = `${parsed.major}.${parsed.minor + 1}.0`;
          }
          
          return versions.filter(pkg => 
            semver.gte(pkg.version, minVersion) && 
            semver.lt(pkg.version, maxVersion)
          );
        }
      }
    }
  
    // Handle caret ranges (^) - allow changes that do not modify the left-most non-zero digit
    if (range.startsWith('^')) {
      const version = range.slice(1);
      if (semver.valid(version)) {
        const parsed = semver.parse(version);
        if (parsed) {
          // ^1.2.3 := >=1.2.3 <2.0.0
          // ^0.2.3 := >=0.2.3 <0.3.0
          // ^0.0.3 := >=0.0.3 <0.0.4
          const minVersion = version;
          let maxVersion: string;
          
          if (parsed.major > 0) {
            const incVersion = semver.inc(version, 'major');
            maxVersion = incVersion !== null ? incVersion : version;
          } else if (parsed.minor > 0) {
            const incVersion = semver.inc(version, 'minor');
            maxVersion = incVersion !== null ? incVersion : version;
          } else {
            const incVersion = semver.inc(version, 'patch');
            maxVersion = incVersion !== null ? incVersion : version;
          }
          
          return versions.filter(pkg => 
            semver.gte(pkg.version, minVersion) && 
            semver.lt(pkg.version, maxVersion)
          );
        }
      }
    }
  
    // If the range format is not recognized or invalid, return empty array
    return [];
}
  
// Helper function to validate version ranges
export function isValidVersionRange(range: string): boolean {
    // Check exact version
    if (semver.valid(range)) {
      return true;
    }
  
    // Check bounded range
    if (range.includes('-')) {
      const [start, end] = range.split('-');
      if (start && end) {
        return semver.valid(start) !== null && semver.valid(end) !== null;
      }
    }
  
    // Check tilde range
    if (range.startsWith('~')) {
      return semver.valid(range.slice(1)) !== null;
    }
  
    // Check caret range
    if (range.startsWith('^')) {
      return semver.valid(range.slice(1)) !== null;
    }
  
    return false;
}

export async function getPackageVersions(packageName: string, versionRange?: string): Promise<PackageMetadata[]> {
    if (versionRange && !isValidVersionRange(versionRange)) {
      throw new Error(`Invalid version range format: ${versionRange}`);
    }
  
    const results = await queryItems(
      'packageName = :pkg',
      { ':pkg': packageName }
    );
    
    if (versionRange) {
      return filterVersionsByRange(results as PackageMetadata[], versionRange);
    }
    return results as PackageMetadata[];
}