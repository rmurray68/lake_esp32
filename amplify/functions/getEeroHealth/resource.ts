import { defineFunction } from '@aws-amplify/backend';

export const getEeroHealth = defineFunction({
  name: 'getEeroHealth',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 30,
});
