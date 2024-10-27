import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand,
  PutCommandInput,
  GetCommandInput,
  QueryCommandInput
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);
const tableName = "ece461-module-metadata";

export interface DynamoDBItem {
  [key: string]: any;
}

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
