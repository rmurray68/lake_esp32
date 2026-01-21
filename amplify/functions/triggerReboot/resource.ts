import { defineFunction, secret } from '@aws-amplify/backend';

export const triggerReboot = defineFunction({
  name: 'triggerReboot',
  entry: './handler.ts',
  environment: {
    LAMBDA_FUNCTION_URL: 'https://poatmimq2hxlfo75ngglui4llm0fllpt.lambda-url.us-east-1.on.aws/default/LakeHouse_Logmor_Controller',
    LAMBDA_API_KEY: secret('LAMBDA_API_KEY'),
  },
});
