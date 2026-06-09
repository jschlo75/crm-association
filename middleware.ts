import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Routes interdites par rôle
const RESTREINT_FORBIDDEN = ["/interactions", "/import", "/admin", "/vergers"];
const MEMBRE_FORBIDDEN    = ["/vergers"];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = (req.nextauth.token as { role?: string })?.role;

    if (role === "RESTREINT" && RESTREINT_FORBIDDEN.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (role === "MEMBRE" && MEMBRE_FORBIDDEN.some((p) => pathname.startsWith(p))) {
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
    "/((?!login|mot-de-passe-oublie|reinitialiser-mot-de-passe|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
