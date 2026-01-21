import { defineFunction } from '@aws-amplify/backend';

export const getDeviceStatus = defineFunction({
  name: 'getDeviceStatus',
  entry: './handler.ts',
  environment: {
    DEVICE_TABLE_NAME: 'LakeHouse_Logs',
    AWS_REGION_NAME: 'us-east-1',
  },
});
