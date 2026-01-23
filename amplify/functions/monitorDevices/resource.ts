import { defineFunction } from '@aws-amplify/backend';

export const monitorDevices = defineFunction({
  name: 'monitorDevices',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 60,
});
