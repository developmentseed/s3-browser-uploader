# AWS STS Temporary Credentials API

This API endpoint provides temporary AWS credentials via AWS STS (Security Token Service) for secure S3 access.

## Endpoint

- **URL**: `/api/sts`
- **Method**: `POST`
- **Response**: JSON with temporary AWS credentials

## Setup

### 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# S3 Configuration
S3_BUCKET_NAME=your-s3-bucket-name

# IAM Role ARN for STS
IAM_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_ROLE_NAME
```

### 2. AWS IAM Setup

You need to create an IAM role that your application can assume. The role should have:

- **Trust Policy**: Allow your application's AWS credentials to assume this role
- **Permissions Policy**: Basic permissions to call STS (if needed)

Example trust policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_IAM_USER"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### 3. Update Configuration

In `src/app/api/sts/route.ts`, update these constants:
- `BUCKET_NAME`: Your S3 bucket name
- `USERNAME`: Hardcoded username for now (can be made dynamic later)
- `ROLE_ARN`: The ARN of the IAM role you created

## Usage

### Get Temporary Credentials

```bash
curl -X POST http://localhost:3000/api/sts
```

### Response Format

```json
{
  "success": true,
  "credentials": {
    "accessKeyId": "ASIA...",
    "secretAccessKey": "...",
    "sessionToken": "...",
    "expiration": "2024-01-01T12:00:00.000Z",
    "region": "us-east-1"
  },
  "bucket": "your-s3-bucket-name",
  "prefix": "testuser/"
}
```

## Security Features

- **Scoped Permissions**: Credentials only allow access to a specific bucket and username prefix
- **Time-Limited**: Credentials expire after 1 hour
- **Principle of Least Privilege**: Only necessary S3 permissions are granted
- **Session Isolation**: Each request creates a unique session

## Permissions Granted

The temporary credentials allow:
- `s3:GetObject` - Read files
- `s3:PutObject` - Upload files
- `s3:DeleteObject` - Delete files
- `s3:ListBucket` - List bucket contents

All operations are restricted to the specified bucket and username prefix.

## Next Steps

1. **Dynamic Username**: Modify the API to accept username as a parameter
2. **Authentication**: Add user authentication before issuing credentials
3. **Audit Logging**: Log credential requests for security monitoring
4. **Rate Limiting**: Prevent abuse of the credentials endpoint
