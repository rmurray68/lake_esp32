import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Duration } from 'aws-cdk-lib';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { getLogs } from './functions/getLogs/resource';
import { triggerReboot } from './functions/triggerReboot/resource';
import { getEeroHealth } from './functions/getEeroHealth/resource';
import { manageEeroToken } from './functions/manageEeroToken/resource';
import { monitorDevices } from './functions/monitorDevices/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  getLogs,
  triggerReboot,
  getEeroHealth,
  manageEeroToken,
  monitorDevices,
});

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
backend.getLogs.resources.lambda.grantInvoke(
  backend.auth.resources.unauthenticatedUserIamRole
);
backend.getLogs.resources.lambda.grantInvoke(
  backend.auth.resources.authenticatedUserIamRole
);

backend.triggerReboot.resources.lambda.grantInvoke(
  backend.auth.resources.authenticatedUserIamRole
);

backend.getEeroHealth.resources.lambda.grantInvoke(
  backend.auth.resources.authenticatedUserIamRole
);
backend.getEeroHealth.resources.lambda.grantInvoke(
  backend.auth.resources.unauthenticatedUserIamRole
);

backend.manageEeroToken.resources.lambda.grantInvoke(
  backend.auth.resources.authenticatedUserIamRole
);

// Grant Eero Lambda functions permission to invoke LakeHouse_Eero_Test
backend.getEeroHealth.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: ['arn:aws:lambda:us-east-1:326185794606:function:LakeHouse_Eero_Test'],
  })
);

backend.manageEeroToken.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: ['arn:aws:lambda:us-east-1:326185794606:function:LakeHouse_Eero_Test'],
  })
);

// Grant permission to invoke external LakeHouse_Logmor_Controller Lambda
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [
      'arn:aws:lambda:us-east-1:326185794606:function:LakeHouse_Logmor_Controller',
    ],
  })
);

backend.auth.resources.unauthenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [
      'arn:aws:lambda:us-east-1:326185794606:function:LakeHouse_Logmor_Controller',
    ],
  })
);

// Grant permissions for monitorDevices Lambda
backend.monitorDevices.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [
      'arn:aws:lambda:us-east-1:326185794606:function:LakeHouse_Eero_Test',
      'arn:aws:lambda:us-east-1:326185794606:function:LakeHouse_Logmor_Controller',
    ],
  })
);

// Create DynamoDB table for device state storage
const deviceStateTable = new Table(
  backend.monitorDevices.resources.lambda.stack,
  'LakeHouseDeviceState',
  {
    tableName: 'LakeHouse_DeviceState',
    partitionKey: { name: 'deviceId', type: AttributeType.STRING },
    billingMode: BillingMode.PAY_PER_REQUEST,
  }
);

backend.monitorDevices.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:PutItem', 'dynamodb:Query'],
    resources: [
      'arn:aws:dynamodb:us-east-1:326185794606:table/LakeHouse_Logs',
      'arn:aws:dynamodb:us-east-1:326185794606:table/LakeHouse_Logs/index/*',
      deviceStateTable.tableArn,
    ],
  })
);

// Create EventBridge rule to run monitoring every 5 minutes
const monitoringRule = new Rule(
  backend.monitorDevices.resources.lambda.stack,
  'MonitoringSchedule',
  {
    schedule: Schedule.rate(Duration.minutes(5)),
    description: 'Trigger device monitoring every 5 minutes',
  }
);

monitoringRule.addTarget(
  new LambdaFunction(backend.monitorDevices.resources.lambda)
);

// Add function names to outputs for frontend
backend.addOutput({
  custom: {
    getLogsFunctionName: backend.getLogs.resources.lambda.functionName,
    triggerRebootFunctionName: backend.triggerReboot.resources.lambda.functionName,
    getEeroHealthFunctionName: backend.getEeroHealth.resources.lambda.functionName,
    manageEeroTokenFunctionName: backend.manageEeroToken.resources.lambda.functionName,
  },
});
