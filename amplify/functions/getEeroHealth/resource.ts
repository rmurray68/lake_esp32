import { defineFunction } from '@aws-amplify/backend';

export const getEeroHealth = defineFunction({
  name: 'getEeroHealth',
  entry: '../data/getEeroHealth.ts',
  runtime: 20,
  timeoutSeconds: 30,
});
