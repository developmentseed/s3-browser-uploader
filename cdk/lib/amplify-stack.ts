import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as amplify from "@aws-cdk/aws-amplify-alpha";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export interface AmplifyNextAppStackProps extends cdk.StackProps {
  /**
   * GitHub owner for the Amplify app
   */
  githubOwner: string;

  /**
   * GitHub repository for the Amplify app
   */
  githubRepo: string;

  /**
   * GitHub OAuth token secret name in Secrets Manager
   */
  githubTokenSecretName: string;

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
      bucketName: s3BucketName.toLowerCase(),
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
            `https://${props.domainName}`,
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

    const s3AccessRole = new iam.Role(this, "S3AccessRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    uploadBucket.grantReadWrite(s3AccessRole);

    // Create Amplify app with modern constructs
    const amplifyApp = new amplify.App(this, "AmplifyApp", {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: props.githubOwner,
        repository: props.githubRepo,
        oauthToken: cdk.SecretValue.secretsManager(props.githubTokenSecretName),
      }),
      buildSpec: codebuild.BuildSpec.fromObjectToYaml({
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
      environmentVariables: {
        IAM_ROLE_ARN: s3AccessRole.roleArn,
        S3_BUCKET_NAME: uploadBucket.bucketName,
        NEXTAUTH_URL: props.domainName ? `https://${props.domainName}` : "",
        NEXTAUTH_SECRET: props.nextauthSecret,
        OIDC_DISCOVERY_URL: props.oidcDiscoveryUrl,
        OIDC_CLIENT_ID: props.oidcClientId,
        OIDC_ISSUER: props.oidcIssuer || "",
        OIDC_AUDIENCE: props.oidcAudience || "",
      },
    });

    s3AccessRole.grantAssumeRole(amplifyApp.computeRole!);

    // Add branch with environment variables
    const branch = amplifyApp.addBranch(branchName, {
      environmentVariables: {
        NODE_ENV: "production",
        CDK_STACK_NAME: this.stackName,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, "AmplifyAppId", {
      value: amplifyApp.appId,
      description: "Amplify App ID",
    });

    new cdk.CfnOutput(this, "AmplifyAppUrl", {
      value: `https://${branch.branchName}.${amplifyApp.appId}.amplifyapp.com`,
      description: "Amplify App URL",
    });

    new cdk.CfnOutput(this, "S3BucketName", {
      value: uploadBucket.bucketName,
      description: "S3 Bucket for file uploads",
    });
  }
}
