# S3 Browser Upload

A Next.js application for secure file uploads to AWS S3 using temporary credentials via AWS STS.

## Features

- **Secure Authentication**: Temporary AWS credentials via STS with username-scoped permissions
- **File Upload**: Drag and drop file uploads to S3
- **S3 File Explorer**: Browse existing files and directories within your S3 bucket
- **User Isolation**: Each user only sees files within their username prefix
- **Modern UI**: Responsive design with dark/light mode support

## S3 File Explorer

The application includes a built-in S3 file explorer that allows users to:

- Navigate through directories and subdirectories
- View file metadata (size, creation date)
- Browse files scoped to their username prefix
- Navigate back through breadcrumb navigation

### Environment Variables

Create a `.env.local` file in your project root:

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

**Note**: The S3 bucket name is configured on the server side and is returned to the client when credentials are fetched. No client-side environment variables are required for the S3 file explorer.

## Architecture

- **Credential Flow**: Client requests credentials → Server returns credentials + bucket name → Client uses both for S3 operations
- **Client-side S3 Operations**: Uses AWS SDK directly in the browser for listing S3 objects
- **Secure Credentials**: Temporary credentials with limited scope and expiration
- **No Server Storage**: Credentials are never stored on the server
- **User Scoping**: Each user's access is limited to their username prefix

## S3 CORS Configuration

To enable direct browser access to S3, you need to configure CORS on your S3 bucket. This allows the browser to make requests directly to S3 without CORS errors.

### CORS Configuration

Add the following CORS configuration to your S3 bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["http://localhost:3000", "http://localhost:3002", "https://yourdomain.com"],
        "ExposeHeaders": ["ETag"]
    }
]
```

**Important**: Replace the `AllowedOrigins` with your actual domain(s). For development, include `http://localhost:3000` and `http://localhost:3002`.

### How to Configure CORS

1. **AWS Console**: Go to S3 → Your Bucket → Permissions → CORS configuration
2. **AWS CLI**: Use the `aws s3api put-bucket-cors` command
3. **Terraform/CloudFormation**: Include CORS configuration in your IaC

### Benefits of Direct S3 Access

- **Better Performance**: No API round-trips
- **Reduced Server Load**: S3 operations happen directly from client
- **Real-time Updates**: Immediate S3 communication
- **Scalability**: Server doesn't handle S3 listing requests

## Security Features

- **Temporary Credentials**: STS credentials expire after 1 hour
- **Scoped Permissions**: Users only access files within their username prefix
- **Client-side Validation**: S3 operations use user's temporary credentials directly
- **No Credential Storage**: Server never stores or accesses user credentials

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables in `.env.local`
4. Set up AWS IAM roles and permissions
5. Run the development server: `npm run dev`

## Usage

1. **Authentication**: Enter your username to get temporary AWS credentials
2. **File Explorer**: Browse existing files and directories in your S3 bucket
3. **File Upload**: Drag and drop files to upload new content
4. **Navigation**: Click into directories and use breadcrumbs to navigate back

## Dependencies

- Next.js 15.5.2
- React 19.1.0
- AWS SDK v3 for S3 and STS
- React Dropzone for file uploads
- Tailwind CSS for styling
