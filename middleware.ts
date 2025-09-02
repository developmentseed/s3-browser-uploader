import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Add any custom middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token?.sub,
    },
  }
);

export const config = {
  // Protect the API routes
  matcher: ["/api/sts"],
};
