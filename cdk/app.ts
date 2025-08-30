#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AmplifyNextAppStack } from "./lib/amplify-stack";

const app = new cdk.App();

if (!process.env.REPOSITORY_URL) throw new Error("REPOSITORY_URL is not set");
if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is not set");
if (!process.env.OIDC_DISCOVERY_URL)
  throw new Error("OIDC_DISCOVERY_URL is not set");
if (!process.env.OIDC_CLIENT_ID) throw new Error("OIDC_CLIENT_ID is not set");

new AmplifyNextAppStack(app, "S3BrowserUploadStack", {
  repositoryUrl: process.env.REPOSITORY_URL,
  branchName: process.env.BRANCH_NAME,
  domainName: process.env.DOMAIN_NAME,
  nextauthSecret: process.env.NEXTAUTH_SECRET,
  oidcDiscoveryUrl: process.env.OIDC_DISCOVERY_URL,
  oidcClientId: process.env.OIDC_CLIENT_ID,
  oidcIssuer: process.env.OIDC_ISSUER,
  oidcAudience: process.env.OIDC_AUDIENCE,
});
