// Test the handler locally
import { handler } from './handler.ts';

process.env.DYNAMODB_TABLE_NAME = 'LakeHouse_Logs';
process.env.AWS_REGION = 'us-east-1';

const event = {};
const context = {};

handler(event, context)
  .then(result => {
    console.log('Success!');
    console.log('Status:', result.statusCode);
    console.log('Body:', result.body);
  })
  .catch(error => {
    console.error('Error:', error);
  });
