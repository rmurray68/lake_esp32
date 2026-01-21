import { defineFunction } from '@aws-amplify/backend';

export const triggerReboot = defineFunction({
  name: 'triggerReboot',
  entry: './handler.ts',
  environment: {
    // Add your existing Lambda ARN for reboot
    // REBOOT_LAMBDA_ARN: 'your-lambda-arn',
  },
});
