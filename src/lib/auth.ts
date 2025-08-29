import { jwtVerify, createRemoteJWKSet } from "jose";

// Cache the JWKS to avoid fetching it on every request
let jwks: any = null;
let jwksUrl: string | null = null;

async function getJWKS() {
  if (!process.env.OIDC_DISCOVERY_URL) {
    throw new Error("OIDC_DISCOVERY_URL not configured");
  }

  // If we already have the JWKS and it's from the same URL, return it
  if (jwks && jwksUrl === process.env.OIDC_DISCOVERY_URL) {
    return jwks;
  }

  try {
    // Fetch the OIDC discovery document
    const discoveryResponse = await fetch(process.env.OIDC_DISCOVERY_URL);
    const discoveryDoc = await discoveryResponse.json();
    
    // Get the JWKS URL from the discovery document
    const jwksUrl = discoveryDoc.jwks_uri;
    if (!jwksUrl) {
      throw new Error("JWKS URI not found in OIDC discovery document");
    }

    // Create a remote JWKS set
    jwks = createRemoteJWKSet(new URL(jwksUrl));
    return jwks;
  } catch (error) {
    console.error("Failed to fetch JWKS:", error);
    throw new Error("Failed to fetch JWKS from OIDC provider");
  }
}

export async function validateJWT(token: string) {
  try {
    const jwks = await getJWKS();
    
    // Verify the JWT using the JWKS
    const { payload } = await jwtVerify(token, jwks, {
      issuer: process.env.OIDC_ISSUER, // Optional: validate issuer
      audience: process.env.OIDC_AUDIENCE, // Optional: validate audience
    });

    return {
      valid: true,
      payload,
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  } catch (error) {
    console.error("JWT validation failed:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getUserIdFromToken(token: string): Promise<string | null> {
  const result = await validateJWT(token);
  if (result.valid && result.userId) {
    return result.userId as string;
  }
  return null;
}
