import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Routes interdites pour le rôle RESTREINT
const RESTREINT_FORBIDDEN = ["/interactions", "/evenements", "/import", "/admin"];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = (req.nextauth.token as { role?: string })?.role;

    if (role === "RESTREINT" && RESTREINT_FORBIDDEN.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
