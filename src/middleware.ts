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
     * - /questionnaire/* (public client form; link shared via WhatsApp)
     * - /api/auth (NextAuth)
     * - /api/setup (bootstrap)
     * - /api/questionnaire/submit (public; token in body)
     * - _next/static, _next/image, favicon, logo
     */
    "/((?!login|setup|questionnaire|api/auth|api/setup|api/questionnaire/submit|_next|favicon\\.ico|logo\\.png).*)",
  ],
};
