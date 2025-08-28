# S3 Browser Upload

A Next.js application that demonstrates file upload to S3 using temporary AWS credentials obtained via STS.

## Features

- **AWS Credentials Management**: Fetch temporary AWS credentials using username-based authentication
- **File Upload**: Drag and drop file upload interface using react-dropzone
- **Multiple Drop Zones**: Support for multiple droppable areas
- **File Type Validation**: Built-in file type acceptance
- **Dark Mode Support**: Responsive design with dark/light theme support

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **File Handling**: react-dropzone
- **AWS**: STS API for temporary credentials

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with your AWS configuration:
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Usage

### File Upload

The application provides a drag-and-drop interface for file uploads:

- **Main Drop Zone**: Large central area for file uploads
- **Multiple Drop Zones**: Additional smaller drop areas for different purposes
- **File Type Support**: Accepts images, text files, PDFs, ZIPs, and JSON files
- **Click to Browse**: Users can also click to open the file browser

### AWS Credentials

1. Enter your username in the credentials form
2. Click "Fetch Credentials" to obtain temporary AWS credentials
3. Use these credentials for S3 upload operations

## File Drop Implementation

This project uses [react-dropzone](https://react-dropzone.js.org/) for robust file handling:

```tsx
import { useDropzone } from "react-dropzone";

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop: handleFiles,
  multiple: true,
  accept: {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    'text/*': ['.txt', '.md', '.json', '.csv'],
    'application/pdf': ['.pdf'],
    'application/zip': ['.zip'],
    'application/json': ['.json'],
  }
});

return (
  <div {...getRootProps()} className="drop-zone">
    <input {...getInputProps()} />
    {isDragActive ? "Drop files here!" : "Drag files here"}
  </div>
);
```

### Benefits of react-dropzone

- **Browser Compatibility**: Handles edge cases across different browsers
- **Accessibility**: Built-in keyboard navigation and screen reader support
- **File Validation**: Robust file type and size validation
- **Performance**: Optimized drag and drop handling
- **Maintained**: Active development and community support

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   │   └── sts/        # STS credentials endpoint
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page
├── components/          # React components
│   └── CredentialsForm.tsx
└── contexts/           # React contexts
    └── CredentialsContext.tsx
```

## Development

- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Type Check**: `npm run type-check`

## License

MIT
