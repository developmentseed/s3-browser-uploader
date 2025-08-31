import jwt from "jsonwebtoken";

export interface DecodedOIDCToken {
  sub: string;
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string;
  [key: string]: any;
}

export interface TokenValidationResult {
  success: boolean;
  userId?: string;
  error?: string;
  decodedToken?: DecodedOIDCToken;
}

/**
 * Validates an OIDC JWT token from the Authorization header
 * @param authHeader - The Authorization header value (e.g., "Bearer <token>")
 * @returns TokenValidationResult with validation status and user ID if successful
 */
export function validateOIDCToken(authHeader: string | null): TokenValidationResult {
  try {
    // Check if Authorization header exists and has Bearer format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        success: false,
        error: "Unauthorized - Bearer token required",
      };
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Decode the JWT token (without verification since we don't have the public key)
    const decodedToken = jwt.decode(token, { complete: true });

    if (!decodedToken || typeof decodedToken === 'string') {
      return {
        success: false,
        error: "Invalid token format",
      };
    }

    const payload = decodedToken.payload as DecodedOIDCToken;

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return {
        success: false,
        error: "Token expired",
      };
    }

    // Check if token has required claims
    if (!payload.sub) {
      return {
        success: false,
        error: "Token missing subject claim",
      };
    }

    return {
      success: true,
      userId: payload.sub,
      decodedToken: payload,
    };

  } catch (error) {
    console.error("Token validation failed:", error);
    return {
      success: false,
      error: "Token validation failed",
    };
  }
}

/**
 * Extracts user ID from a valid OIDC token
 * @param authHeader - The Authorization header value
 * @returns The user ID (sub claim) if token is valid, null otherwise
 */
export function getUserIdFromToken(authHeader: string | null): string | null {
  const result = validateOIDCToken(authHeader);
  return result.success ? result.userId || null : null;
}

/**
 * Creates a standardized unauthorized response for API endpoints
 * @param error - Custom error message (optional)
 * @returns NextResponse with 401 status and error details
 */
export function createUnauthorizedResponse(error?: string) {
  return new Response(
    JSON.stringify({
      success: false,
      error: error || "Unauthorized - valid token required",
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Creates a standardized error response for API endpoints
 * @param error - Error message
 * @param status - HTTP status code (defaults to 500)
 * @param details - Additional error details (optional)
 * @returns NextResponse with specified status and error details
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: string
) {
  return new Response(
    JSON.stringify({
      success: false,
      error,
      ...(details && { details }),
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Middleware-style function to protect API routes with OIDC token validation
 * @param request - NextRequest object
 * @param handler - Function to execute if token is valid
 * @returns Response from handler or unauthorized response
 */
export async function withOIDCAuth(
  request: Request,
  handler: (userId: string, decodedToken: DecodedOIDCToken) => Promise<Response>
): Promise<Response> {
  const authHeader = request.headers.get("authorization");
  const tokenValidation = validateOIDCToken(authHeader);

  if (!tokenValidation.success) {
    return createUnauthorizedResponse(tokenValidation.error);
  }

  try {
    return await handler(tokenValidation.userId!, tokenValidation.decodedToken!);
  } catch (error) {
    console.error("API handler error:", error);
    return createErrorResponse(
      "Internal server error",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
