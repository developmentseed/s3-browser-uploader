import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as amplify from "aws-cdk-lib/aws-amplify";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";

export interface AmplifyNextAppStackProps extends cdk.StackProps {
  /**
   * GitHub repository URL for the Amplify app
   */
  repositoryUrl: string;

  /**
   * Branch name to deploy (default: main)
   */
  branchName?: string;

  /**
   * S3 bucket name for file uploads
   */
  s3BucketName?: string;

  /**
   * Domain name for the Amplify app (optional)
   */
  domainName?: string;

  /**
   * NEXTAUTH_SECRET
   */
  nextauthSecret: string;

  /**
   * OIDC_DISCOVERY_URL
   */
  oidcDiscoveryUrl: string;

  /**
   * OIDC_CLIENT_ID
   */
  oidcClientId: string;

  /**
   * OIDC_ISSUER
   */
  oidcIssuer?: string;

  /**
   * OIDC_AUDIENCE
   */
  oidcAudience?: string;
}

export class AmplifyNextAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AmplifyNextAppStackProps) {
    super(scope, id, props);

    const branchName = props.branchName || "main";
    const s3BucketName =
      props.s3BucketName || `${cdk.Stack.of(this).stackName}-file-uploads`;

    // Create S3 bucket for file uploads
    const uploadBucket = new s3.Bucket(this, "UploadBucket", {
      bucketName: s3BucketName,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: [
            "http://localhost:3000",
            "http://localhost:3002",
            // Add your production domain here
          ],
          exposedHeaders: [
            "ETag",
            "x-amz-multipart-upload-id",
            "x-amz-version-id",
            "x-amz-checksum-crc32",
          ],
        },
      ],
    });

    // Create IAM role for Amplify to assume
    const amplifyServiceRole = new iam.Role(this, "AmplifyServiceRole", {
      assumedBy: new iam.ServicePrincipal("amplify.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AdministratorAccess-Amplify"
        ),
      ],
    });

    // Create IAM role for Lambda execution (for your API routes)
    const lambdaExecutionRole = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    const s3AccessRole = new iam.Role(this, "S3AccessRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    uploadBucket.grantReadWrite(s3AccessRole);
    s3AccessRole.grantAssumeRole(lambdaExecutionRole);

    // Create Amplify app
    const amplifyApp = new amplify.CfnApp(this, "AmplifyApp", {
      name: `${this.stackName}-app`,
      platform: "WEB_COMPUTE",
      repository: props.repositoryUrl,
      iamServiceRole: amplifyServiceRole.roleArn,

      // Environment variables for all branches
      environmentVariables: Object.entries({
        IAM_ROLE_ARN: s3AccessRole.roleArn,
        S3_BUCKET_NAME: uploadBucket.bucketName,
        NEXTAUTH_URL: props.domainName ? `https://${props.domainName}` : "",
        NEXTAUTH_SECRET: props.nextauthSecret,
        OIDC_DISCOVERY_URL: props.oidcDiscoveryUrl,
        OIDC_CLIENT_ID: props.oidcClientId,
        OIDC_ISSUER: props.oidcIssuer,
        OIDC_AUDIENCE: props.oidcAudience,
      }).map(([name, value]) => ({ name, value })),
    });

    // Create branch with build specification
    const branch = new amplify.CfnBranch(this, "MainBranch", {
      appId: amplifyApp.attrAppId,
      branchName: branchName,
      enableAutoBuild: true,
      enablePerformanceMode: true,

      // Branch-specific environment variables
      environmentVariables: [
        { name: "NODE_ENV", value: "production" },
        { name: "CDK_STACK_NAME", value: this.stackName },
      ],

      // Build specification
      buildSpec: JSON.stringify({
        version: "1.0",
        frontend: {
          phases: {
            preBuild: {
              commands: ["npm install -g pnpm", "pnpm install"],
            },
            build: {
              commands: [
                "env | grep -e IAM_ROLE_ARN >> .env.production",
                "env | grep -e S3_BUCKET_NAME >> .env.production",
                "env | grep -e NEXTAUTH_URL >> .env.production",
                "env | grep -e NEXTAUTH_SECRET >> .env.production",
                "env | grep -e OIDC_DISCOVERY_URL >> .env.production",
                "env | grep -e OIDC_CLIENT_ID >> .env.production",
                "env | grep -e OIDC_ISSUER >> .env.production || true",
                "env | grep -e OIDC_AUDIENCE >> .env.production || true",
                "pnpm run build",
              ],
            },
          },
          artifacts: {
            baseDirectory: ".next",
            files: ["**/*"],
          },
          cache: {
            paths: ["node_modules/**/*", ".next/cache/**/*"],
          },
        },
      }),
    });

    // Outputs
    new cdk.CfnOutput(this, "AmplifyAppId", {
      value: amplifyApp.attrAppId,
      description: "Amplify App ID",
    });

    new cdk.CfnOutput(this, "AmplifyAppUrl", {
      value: `https://${branch.attrBranchName}.${amplifyApp.attrAppId}.amplifyapp.com`,
      description: "Amplify App URL",
    });

    new cdk.CfnOutput(this, "S3BucketName", {
      value: uploadBucket.bucketName,
      description: "S3 Bucket for file uploads",
    });

    new cdk.CfnOutput(this, "LambdaExecutionRoleArn", {
      value: lambdaExecutionRole.roleArn,
      description: "Lambda execution role ARN",
    });
  }
}
