import { defineBackend } from '@aws-amplify/backend';
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
