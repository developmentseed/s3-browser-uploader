#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AmplifyNextAppStack } from "./lib/amplify-stack";

const app = new cdk.App();

if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is not set");
if (!process.env.OIDC_DISCOVERY_URL)
  throw new Error("OIDC_DISCOVERY_URL is not set");
if (!process.env.OIDC_CLIENT_ID) throw new Error("OIDC_CLIENT_ID is not set");
if (!process.env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not set");
if (!process.env.REPOSITORY) throw new Error("REPOSITORY is not set");
if (!process.env.PAT_SECRET_NAME) throw new Error("PAT_SECRET_NAME is not set");

const githubMatch = process.env.REPOSITORY.match(/^([^/]+)\/([^/]+)$/);
if (!githubMatch)
  throw new Error("REPOSITORY is not in the format of org/repo");
const githubOwner = githubMatch[1];
const githubRepo = githubMatch[2];

new AmplifyNextAppStack(app, "S3BrowserUploadStack", {
  githubOwner,
  githubRepo,
  githubTokenSecretName: process.env.PAT_SECRET_NAME,
  branchName: process.env.BRANCH_NAME,
  domainName: process.env.DOMAIN_NAME,
  nextauthSecret: process.env.NEXTAUTH_SECRET,
  oidcDiscoveryUrl: process.env.OIDC_DISCOVERY_URL,
  oidcClientId: process.env.OIDC_CLIENT_ID,
  oidcIssuer: process.env.OIDC_ISSUER,
  oidcAudience: process.env.OIDC_AUDIENCE,
});
