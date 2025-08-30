#!/bin/bash

# Setup GitHub OIDC Provider and IAM Role for GitHub Actions
# This script creates the necessary AWS resources for secure GitHub Actions deployment

set -e

# Configuration
GITHUB_ORG=${1:-"developmentseed"}
GITHUB_REPO=${2:-"s3-browser-upload"}
ROLE_NAME=${3:-"github-actions-role"}
STACK_NAME="github-oidc-setup"

echo "Setting up GitHub OIDC provider and IAM role..."
echo "GitHub Org: $GITHUB_ORG"
echo "GitHub Repo: $GITHUB_REPO"
echo "Role Name: $ROLE_NAME"
echo "Stack Name: $STACK_NAME"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "Error: AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo ""

# Create the CloudFormation stack
echo "Creating CloudFormation stack..."
aws cloudformation create-stack \
    --stack-name "$STACK_NAME" \
    --template-body file://cdk/github-oidc-setup.yml \
    --parameters \
        ParameterKey=GitHubOrg,ParameterValue="$GITHUB_ORG" \
        ParameterKey=GitHubRepo,ParameterValue="$GITHUB_REPO" \
        ParameterKey=RoleName,ParameterValue="$ROLE_NAME" \
    --capabilities CAPABILITY_NAMED_IAM

echo "Waiting for stack creation to complete..."
aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME"

# Get the role ARN
ROLE_ARN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`RoleArn`].OutputValue' \
    --output text)

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add the following secret to your GitHub repository:"
echo "   AWS_ROLE_ARN: $ROLE_ARN"
echo ""
echo "2. Add all other required secrets from DEPLOYMENT.md"
echo ""
echo "3. Push to main/develop branch or create a PR to trigger deployment"
echo ""
echo "Stack outputs:"
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs' \
    --output table
