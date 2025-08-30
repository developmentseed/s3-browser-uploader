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

## Deployment

This project includes automated deployment via GitHub Actions with OIDC authentication. See [DEPLOYMENT.md](DEPLOYMENT.md) for complete setup instructions.

### Quick Setup

1. Run the setup script to create AWS resources:
   ```bash
   ./scripts/setup-github-oidc.sh [github-org] [github-repo] [role-name]
   ```

2. Add the required secrets to your GitHub repository
3. Push to main/develop branch to trigger deployment

The workflow will automatically deploy your CDK stack with all environment variables configured.

### NextAuth Secret Requirement

**Important**: Even though this application doesn't generate JWTs itself, NextAuth.js requires a `NEXTAUTH_SECRET` environment variable in production for:

- **Session encryption**: Encrypting session data stored in cookies
- **CSRF protection**: Generating and validating CSRF tokens  
- **Cookie signing**: Preventing cookie tampering
- **Security headers**: Various security operations

**Generate a strong secret** using one of these methods:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Set the secret** in your production environment (AWS Amplify, Vercel, etc.) as `NEXTAUTH_SECRET`.

### Environment Variables

Create a `.env.local` file with:

```bash
# OIDC Configuration
OIDC_DISCOVERY_URL=https://your-oidc-provider/.well-known/openid_configuration
OIDC_CLIENT_ID=your-oidc-client-id
OIDC_ISSUER=https://your-oidc-provider  # Optional: for JWT issuer validation
OIDC_AUDIENCE=your-app-audience  # Optional: for JWT audience validation

# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-key-here  # Required for session encryption and security
NEXTAUTH_URL=http://localhost:3000  # Your app URL (development)

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

## Deployment

### AWS Amplify

This project includes an `amplify.yml` configuration file for AWS Amplify deployment. The build process:

1. **Installs pnpm** globally during preBuild phase
2. **Installs dependencies** using `pnpm install`
3. **Builds the application** using `pnpm run build`
4. **Outputs artifacts** from the `.next` directory

**Required Environment Variables in Amplify:**
- `NEXTAUTH_SECRET`: Strong random secret for NextAuth.js
- `OIDC_DISCOVERY_URL`: Your OIDC provider discovery URL
- `OIDC_CLIENT_ID`: Your OIDC client ID
- `NEXTAUTH_URL`: Your production domain (e.g., `https://yourdomain.com`)

**Note**: The `amplify.yml` file handles the pnpm installation automatically, so you don't need to worry about package manager availability.

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

### Build Configuration

- **`amplify.yml`**: AWS Amplify build configuration for production deployment
- **`next.config.ts`**: Next.js configuration
- **`tsconfig.json`**: TypeScript configuration
- **`tailwind.config.js`**: Tailwind CSS configuration

## Troubleshooting

### Common Issues

1. **Checksum Validation Errors**: Ensure CORS includes `x-amz-checksum-crc32` header
2. **Multipart Upload Failures**: Verify IAM role has all required multipart permissions
3. **CORS Errors**: Check that your domain is included in `AllowedOrigins`
4. **NextAuth Secret Errors**: Ensure `NEXTAUTH_SECRET` is set in production environment
5. **Session Issues**: Verify `NEXTAUTH_URL` matches your production domain

### Debug Mode

The application now shows native AWS error messages to help diagnose configuration issues.
