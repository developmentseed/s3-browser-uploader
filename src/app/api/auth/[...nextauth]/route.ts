import NextAuth, { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
         secret: process.env.NEXTAUTH_SECRET,
         providers: [
           {
             id: "oidc",
             name: "OIDC",
             type: "oauth" as const,
             wellKnown: process.env.OIDC_DISCOVERY_URL,
             clientId: process.env.OIDC_CLIENT_ID!,
             clientSecret: undefined,
             authorization: {
               params: {
                 scope: "openid profile email",
                 response_type: "code",
                 code_challenge_method: "S256",
               },
             },
             checks: ["pkce"],
             client: {
               token_endpoint_auth_method: "none",
             },
             profile(profile: any) {
               return {
                 id: profile.sub,
                 name: profile.name,
                 email: profile.email,
               };
             },
           },
         ],
         session: {
           strategy: "jwt",
           maxAge: 60 * 60 * 24,
         },
         jwt: {
           maxAge: 60 * 60 * 24, // 24 hours
         },
         callbacks: {
           async jwt({ token, account, profile }: any) {
             if (account) {
               // Store only essential data
               token.accessToken = account.access_token;
               token.userId = profile?.sub;
               token.userName = profile?.name;
               token.userEmail = profile?.email;
             }
             return token;
           },
           async session({ session, token }: any) {
             // Keep session minimal
             session.accessToken = token.accessToken;
             session.user.id = token.userId;
             session.user.name = token.userName;
             session.user.email = token.userEmail;
             return session;
           },
         },
         debug: process.env.NODE_ENV === "development",
         // Add these for better session handling
         cookies: {
           sessionToken: {
             name: `next-auth.session-token`,
             options: {
               httpOnly: true,
               sameSite: "lax",
               path: "/",
               secure: process.env.NODE_ENV === "production",
             },
           },
         },
       };

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
