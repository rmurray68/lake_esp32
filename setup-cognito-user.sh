#!/bin/bash

# Setup Cognito User after Amplify deployment
# Run this script after your Amplify app is deployed

set -e

echo "Setting up Cognito user for Lake ESP32 Dashboard..."

# Get User Pool ID from amplify_outputs.json
if [ ! -f "amplify_outputs.json" ]; then
    echo "Error: amplify_outputs.json not found. Make sure the backend is deployed first."
    exit 1
fi

USER_POOL_ID=$(grep -o '"user_pool_id":"[^"]*"' amplify_outputs.json | cut -d'"' -f4)

if [ -z "$USER_POOL_ID" ]; then
    echo "Error: Could not find user_pool_id in amplify_outputs.json"
    exit 1
fi

echo "Found User Pool ID: $USER_POOL_ID"

# User details
EMAIL="rpm228@gmail.com"

# Prompt for password securely
echo "Enter password for $EMAIL:"
read -s PASSWORD
echo ""

if [ -z "$PASSWORD" ]; then
    echo "Error: Password cannot be empty"
    exit 1
fi

echo "Creating user: $EMAIL"

# Create user
aws cognito-idp admin-create-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$EMAIL" \
  --user-attributes Name=email,Value="$EMAIL" Name=email_verified,Value=true \
  --temporary-password "TempPassword123!" \
  --message-action SUPPRESS \
  --region us-east-1

echo "Setting permanent password..."

# Set permanent password
aws coer-pool-id "$USER_POOL_ID" \
  --username "$EMAIL" \
  --password "$PASSWORD" \
  --permanent \
  --region us-east-1

echo "✅ User created successfully!"
echo "Email: $EMAIL"
echo "Password: $PASSWORD"
echo ""
echo "You can now login to your dashboard at the Amplify app URL"
