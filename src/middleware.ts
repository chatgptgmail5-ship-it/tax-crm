import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
    callbacks: { authorized: ({ token }) => !!token },
  }
);

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /login
     * - /setup
     * - /api/auth (NextAuth)
     * - _next/static
     * - _next/image
     * - favicon.ico
     */
    "/((?!login|setup|api/auth|api/setup|_next|favicon\\.ico|logo\\.png).*)",
  ],
};
