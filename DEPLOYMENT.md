# Deployment Guide

This project uses GitHub Actions with OIDC (OpenID Connect) to securely deploy to AWS without storing long-term AWS credentials.

## Prerequisites

1. AWS CLI configured with appropriate permissions
2. CDK installed globally (`npm install -g aws-cdk`)
3. GitHub repository with Actions enabled

## Setup GitHub OIDC Provider

### 1. Create IAM Identity Provider

First, create an IAM identity provider for GitHub in your AWS account:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### 2. Create IAM Role for GitHub Actions

Create an IAM role that GitHub Actions can assume:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/YOUR_REPO_NAME:*"
        }
      }
    }
  ]
}
```

Replace:
- `YOUR_ACCOUNT_ID` with your AWS account ID
- `YOUR_GITHUB_USERNAME` with your GitHub username
- `YOUR_REPO_NAME` with your repository name

### 3. Attach Required Policies

Attach the following policies to the role:
- `AdministratorAccess` (or more restrictive policies based on your needs)
- Any custom policies required for your CDK stack

## Configure GitHub Secrets

Add the following secrets to your GitHub repository (Settings > Secrets and variables > Actions):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_ROLE_ARN` | ARN of the IAM role created above | `arn:aws:iam::123456789012:role/github-actions-role` |
| `REPOSITORY_URL` | Your GitHub repository URL | `https://github.com/username/repo-name` |
| `DOMAIN_NAME` | Domain name for your application | `example.com` |
| `NEXTAUTH_SECRET` | Secret key for NextAuth.js | `your-secret-key-here` |
| `OIDC_DISCOVERY_URL` | OIDC discovery URL | `https://your-oidc-provider/.well-known/openid_configuration` |
| `OIDC_CLIENT_ID` | OIDC client ID | `your-oidc-client-id` |
| `OIDC_ISSUER` | OIDC issuer URL | `https://your-oidc-provider` |
| `OIDC_AUDIENCE` | OIDC audience (optional) | `your-app-audience` |

## Deployment

The workflow will automatically run on:
- Push to `main` or `develop` branches
- Pull requests to `main` branch
- Manual trigger via workflow dispatch

## Workflow Features

- **OIDC Authentication**: Secure AWS authentication without stored credentials
- **pnpm Support**: Uses pnpm for package management with caching
- **CDK Bootstrap**: Automatically bootstraps CDK if needed
- **Environment Variables**: Passes all required environment variables to CDK
- **Caching**: Caches pnpm store and npm dependencies for faster builds

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the IAM role has sufficient permissions
2. **OIDC Provider Not Found**: Verify the identity provider was created correctly
3. **Missing Secrets**: Check that all required secrets are configured in GitHub
4. **CDK Bootstrap Required**: The workflow will attempt to bootstrap automatically

### Manual Deployment

If you need to deploy manually:

```bash
# Install dependencies
pnpm install

# Deploy CDK stack
cdk deploy --require-approval never
```

## Security Notes

- The workflow uses OIDC tokens that expire after each run
- No long-term AWS credentials are stored in GitHub
- The IAM role should follow the principle of least privilege
- Consider using more restrictive IAM policies in production
