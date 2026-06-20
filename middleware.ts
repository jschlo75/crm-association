import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Routes interdites par rôle
const RESTREINT_FORBIDDEN = ["/interactions", "/import", "/admin", "/campagnes"];
const MEMBRE_FORBIDDEN    = ["/vergers"];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token as { role?: string; consentementPartageContacts?: boolean };
    const role = token?.role;

    // Utilisateur RESTREINT sans consentement → page de bienvenue/consentement
    if (
      role === "RESTREINT" &&
      !token?.consentementPartageContacts &&
      !pathname.startsWith("/consentement") &&
      !pathname.startsWith("/api/consentement") &&
      !pathname.startsWith("/api/auth") &&
      !pathname.startsWith("/api/profil") &&
      !pathname.startsWith("/api/organisations") &&
      !pathname.startsWith("/api/interlocuteurs")
    ) {
      return NextResponse.redirect(new URL("/consentement", req.url));
    }

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
    "/((?!login|mot-de-passe-oublie|reinitialiser-mot-de-passe|api/auth|api/mot-de-passe-oublie|api/reinitialiser-mot-de-passe|_next/static|_next/image|favicon.ico).*)",
  ],
};
