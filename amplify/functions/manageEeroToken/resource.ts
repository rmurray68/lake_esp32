import { defineFunction } from '@aws-amplify/backend';

export const manageEeroToken = defineFunction({
  name: 'manageEeroToken',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 30,
});
