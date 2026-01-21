import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { getDeviceStatus } from './functions/getDeviceStatus/resource';
import { triggerReboot } from './functions/triggerReboot/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  getDeviceStatus,
  triggerReboot,
});

// Grant DynamoDB read permissions to getDeviceStatus
backend.getDeviceStatus.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:Query', 'dynamodb:GetItem', 'dynamodb:Scan'],
    resources: [
      'arn:aws:dynamodb:us-east-1:326185794606:table/LakeHouse_Logs',
      'arn:aws:dynamodb:us-east-1:326185794606:table/LakeHouse_Logs/index/*',
    ],
  })
);

// Note: triggerReboot uses Lambda Function URL (with API key) instead of direct invocation

// Add API routes for the Lambda functions
backend.getDeviceStatus.resources.lambda.grantInvoke(
  backend.auth.resources.unauthenticatedUserIamRole
);
backend.getDeviceStatus.resources.lambda.grantInvoke(
  backend.auth.resources.authenticatedUserIamRole
);

backend.triggerReboot.resources.lambda.grantInvoke(
  backend.auth.resources.authenticatedUserIamRole
);
