# S3 Browser Upload

A secure file upload solution that creates private workspaces for users in S3 buckets.

## Features

- **Secure File Upload**: Uses AWS STS temporary credentials for secure file uploads
- **Multipart Upload**: Supports large files with automatic multipart upload using AWS SDK
- **Real-time Progress**: Live progress tracking showing bytes uploaded vs total bytes
- **File Explorer**: Browse S3 buckets and navigate directories
- **Drag & Drop**: Intuitive drag and drop interface for file selection
- **Progress Visualization**: Visual progress bars and status indicators for uploads
- **File Management**: Delete files directly from the file explorer with confirmation dialogs

## How It Works

1. **User logs in** via OIDC provider (like Keycloak)
2. **App generates temporary AWS credentials** for the user
3. **User gets access to their private workspace** - a folder in S3 named after their user ID
4. **Files upload directly to S3** using multipart uploads (supports files up to 5TB)
5. **Users can only see/edit files in their own workspace** - complete data isolation

## Deployment

The app deploys automatically when you push code:

- **GitHub Actions** runs CDK to configure AWS infrastructure
- **AWS CDK** creates the infrastructure (S3 bucket, IAM roles, Amplify app, etc.)
- **AWS Amplify** deploys and hosts the Next.js app

## Setup

Add these secrets to your GitHub repository:

- `NEXTAUTH_SECRET`: Random string for security
- `OIDC_DISCOVERY_URL`: Your OIDC provider endpoint
- `OIDC_CLIENT_ID`: Your OIDC app ID
- `REPOSITORY`: GitHub repository in format `org/repo`
- `PAT_SECRET_NAME`: Name of the Secret in AWS Secrets Manager that contains a valid GitHub Personal Access Token
- `BRANCH_NAME`: Branch to deploy (e.g., main)
- `DOMAIN_NAME`: Custom domain for the app (optional)
- `OIDC_ISSUER`: OIDC issuer URL (optional)
- `OIDC_AUDIENCE`: OIDC audience (optional)

> **NOTE**: The GitHub Personal Access Token must have "Read and Write access to repository hooks" permission to enable AWS Amplify integration.

## Development

```bash
pnpm install
pnpm run dev
```
