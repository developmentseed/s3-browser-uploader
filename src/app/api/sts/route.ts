import { NextRequest, NextResponse } from "next/server";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// Configuration from environment variables
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "24hr-tmp";
const ROLE_ARN =
  process.env.IAM_ROLE_ARN ||
  "arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_ROLE_NAME"; // IAM role ARN

export async function POST(request: NextRequest) {
  try {
    // Use NextAuth's getServerSession for proper session validation
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - valid session required",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Create STS client
    const stsClient = new STSClient({
      region: process.env.AWS_REGION || "us-east-1",
    });

    // Create the policy document for the temporary credentials
    const policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["s3:ListBucket"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}`],
          Condition: {
            StringLike: {
              "s3:prefix": [`${userId}/*`, `${userId}`],
            },
          },
        },
        {
          Effect: "Allow",
          Action: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:AbortMultipartUpload",
            "s3:ListMultipartUploadParts",
            "s3:PutObjectAcl",
          ],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/${userId}/*`],
        },
      ],
    };

    // Assume role with the policy
    const assumeRoleCommand = new AssumeRoleCommand({
      RoleArn: ROLE_ARN,
      RoleSessionName: `s3-upload-${userId}-${Date.now()}`,
      DurationSeconds: 3600, // 1 hour
      Policy: JSON.stringify(policyDocument),
    });

    const assumeRoleResult = await stsClient.send(assumeRoleCommand);

    if (!assumeRoleResult.Credentials) {
      throw new Error("Failed to get credentials from STS");
    }

    // Return the temporary credentials
    return NextResponse.json({
      success: true,
      credentials: {
        accessKeyId: assumeRoleResult.Credentials.AccessKeyId,
        secretAccessKey: assumeRoleResult.Credentials.SecretAccessKey,
        sessionToken: assumeRoleResult.Credentials.SessionToken,
        expiration: assumeRoleResult.Credentials.Expiration,
        region: process.env.AWS_REGION || "us-east-1",
      },
      bucket: BUCKET_NAME,
      prefix: `${userId}/`,
    });
  } catch (error) {
    console.error("Error getting STS credentials:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get temporary credentials",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET method for testing
export async function GET() {
  return NextResponse.json({
    message: "STS credentials endpoint",
    method: "POST",
    description:
      "Send a POST request with Bearer token to get temporary AWS credentials",
  });
}
