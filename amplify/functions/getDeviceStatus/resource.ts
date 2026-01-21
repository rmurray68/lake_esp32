import { defineFunction } from '@aws-amplify/backend';

export const getDeviceStatus = defineFunction({
  name: 'getDeviceStatus',
  entry: './handler.ts',
  environment: {
    // Add your existing Lambda ARN or DynamoDB table name
    // DEVICE_TABLE_NAME: 'your-dynamodb-table-name',
  },
});
