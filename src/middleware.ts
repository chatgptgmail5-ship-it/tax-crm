import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/** Paths that must work without a session (shared link + public submit API). */
function isPublicQuestionnaireAccess(pathname: string): boolean {
  if (pathname === "/questionnaire" || pathname.startsWith("/questionnaire/")) return true;
  if (pathname === "/api/questionnaire/submit") return true;
  return false;
}

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
    callbacks: {
      authorized: ({ token, req }) => {
        if (isPublicQuestionnaireAccess(req.nextUrl.pathname)) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Run middleware on all app routes except static/auth/bootstrap.
     * Public questionnaire URLs are allowed inside authorized() (no token required).
     */
    "/((?!login|setup|api/auth|api/setup|_next|favicon\\.ico|logo\\.png).*)",
  ],
};
