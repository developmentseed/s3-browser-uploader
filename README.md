# S3 Browser Upload

A secure file upload solution powered by AWS S3 with multipart upload support and real-time progress tracking.

## Features

- **Secure File Upload**: Uses AWS STS temporary credentials for secure file uploads
- **Multipart Upload**: Supports large files with automatic multipart upload using AWS SDK
- **Real-time Progress**: Live progress tracking showing bytes uploaded vs total bytes
- **File Explorer**: Browse S3 buckets and navigate directories
- **Drag & Drop**: Intuitive drag and drop interface for file selection
- **Progress Visualization**: Visual progress bars and status indicators for uploads
- **File Management**: Delete files directly from the file explorer with confirmation dialogs

## How It Works

### File Upload Process

1. **File Selection**: Users can drag and drop files or click to browse and select files
2. **Path Detection**: Files are automatically uploaded to the currently viewed directory in the S3 file explorer
3. **Multipart Upload**: Large files are automatically split into 5MB chunks for efficient upload
4. **Progress Tracking**: Real-time progress updates show:
   - Current upload status (uploading, completed, error)
   - Bytes uploaded vs total bytes
   - Visual progress bars
   - Status icons and messages

### Upload States

- **Uploading**: Orange progress bar with spinning indicator
- **Completed**: Green checkmark with "Upload completed" message
- **Error**: Red error icon with error details

### Technical Implementation

- Uses `@aws-sdk/lib-storage` for multipart uploads
- Configurable chunk size (5MB) and concurrent uploads (4)
- Automatic cleanup of completed uploads after 5 seconds
- File list refresh after uploads complete
- Error handling with detailed error messages
- File deletion via S3 DeleteObject API with user confirmation

## Usage

1. Navigate to the application with a username parameter: `/?user=yourusername`
2. Provide AWS credentials when prompted
3. Browse to the desired directory in the S3 file explorer
4. Drag and drop files or click "Choose Files" to select files
5. Monitor upload progress in real-time
6. Files appear in the explorer once uploads complete
7. Delete files by clicking the trash icon next to any file (with confirmation dialog)

## Authentication

This application uses NextAuth.js with OIDC (OpenID Connect) authentication for secure access. The system validates JWTs directly against your OIDC provider's public keys.

### Environment Variables

Create a `.env.local` file with:

```bash
# OIDC Configuration
OIDC_DISCOVERY_URL=https://your-oidc-provider/.well-known/openid_configuration
OIDC_CLIENT_ID=your-oidc-client-id
OIDC_ISSUER=https://your-oidc-provider  # Optional: for JWT issuer validation
OIDC_AUDIENCE=your-app-audience  # Optional: for JWT audience validation

# AWS Configuration
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
IAM_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_ROLE_NAME
```

### OIDC Provider Setup

1. Create a new application/client in your OIDC provider (Auth0, Okta, Keycloak, etc.)
2. Set client type to "Public" or "SPA"
3. Configure redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/oidc`
   - Production: `https://yourdomain.com/api/auth/callback/oidc`
4. Enable scopes: `openid`, `profile`, `email`
5. Ensure PKCE is enabled (default for public clients)

## AWS Configuration Requirements

### S3 Bucket CORS Configuration

Your S3 bucket must have the following CORS configuration to support multipart uploads with checksums:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:3002",
            "https://yourdomain.com"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-multipart-upload-id",
            "x-amz-version-id",
            "x-amz-checksum-crc32"
        ]
    }
]
```

**Critical**: The `x-amz-checksum-crc32` header is essential for multipart uploads with checksums to work properly.

### IAM Role Permissions

The IAM role being assumed must have these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "BucketOperations",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
        },
        {
            "Sid": "ObjectOperations",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:AbortMultipartUpload",
                "s3:ListMultipartUploadParts",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

### Required IAM Actions Explained

- **`s3:ListBucket`**: Browse bucket contents
- **`s3:PutObject`**: Upload files
- **`s3:GetObject`**: Download/view files
- **`s3:DeleteObject`**: Remove files
- **`s3:AbortMultipartUpload`**: Clean up failed multipart uploads
- **`s3:ListMultipartUploadParts`**: Track multipart upload progress
- **`s3:PutObjectAcl`**: Set object metadata and permissions

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build
```

## Dependencies

- `@aws-sdk/client-s3`: S3 client for file operations
- `@aws-sdk/client-sts`: STS client for temporary credentials
- `@aws-sdk/lib-storage`: Multipart upload support
- `react-dropzone`: Drag and drop file interface
- `next`: React framework
- `tailwindcss`: Styling

## Architecture

The application uses a component-based architecture with:

- **FileUploadSection**: Main upload coordinator
- **DropZone**: File selection and drag & drop interface
- **S3FileExplorer**: File browser with upload progress display
- **CredentialsContext**: AWS credentials management

Upload progress is managed at the FileUploadSection level and passed down to child components for display.

## Troubleshooting

### Common Issues

1. **Checksum Validation Errors**: Ensure CORS includes `x-amz-checksum-crc32` header
2. **Multipart Upload Failures**: Verify IAM role has all required multipart permissions
3. **CORS Errors**: Check that your domain is included in `AllowedOrigins`

### Debug Mode

The application now shows native AWS error messages to help diagnose configuration issues.
