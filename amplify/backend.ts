import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { getDeviceStatus } from './functions/getDeviceStatus/resource';
import { getLogs } from './functions/getLogs/resource';
import { triggerReboot } from './functions/triggerReboot/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  getDeviceStatus,
  getLogs,
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

// Grant DynamoDB read permissions to getLogs
backend.getLogs.resources.lambda.addToRolePolicy(
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

backend.getLogs.resources.lambda.grantInvoke(
  backend.auth.resources.unauthenticatedUserIamRole
);
backend.getLogs.resources.lambda.grantInvoke(
  backend.auth.resources.authenticatedUserIamRole
);

backend.triggerReboot.resources.lambda.grantInvoke(
  backend.auth.resources.authenticatedUserIamRole
);

// Grant permission to invoke external LakeHouse_Logmor_Controller Lambda
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [
      'arn:aws:lambda:us-east-1:326185794606:function:LakeHouse_Logmor_Controller',
      'arn:aws:lambda:us-east-1:326185794606:function:LakeHouse_ESP32_Controller',
    ],
  })
);

backend.auth.resources.unauthenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [
      'arn:aws:lambda:us-east-1:326185794606:function:LakeHouse_Logmor_Controller',
      'arn:aws:lambda:us-east-1:326185794606:function:LakeHouse_ESP32_Controller',
    ],
  })
);

// Add function names to outputs for frontend
backend.addOutput({
  custom: {
    getDeviceStatusFunctionName: backend.getDeviceStatus.resources.lambda.functionName,
    getLogsFunctionName: backend.getLogs.resources.lambda.functionName,
    triggerRebootFunctionName: backend.triggerReboot.resources.lambda.functionName,
  },
});
