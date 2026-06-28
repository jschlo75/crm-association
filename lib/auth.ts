import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 2 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.actif) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        // Tracer la connexion
        await prisma.loginLog.create({
          data: { userId: user.id, email: user.email, nom: user.nom, role: user.role },
        });

        return { id: user.id, name: user.nom, email: user.email, role: user.role, consentementPartageContacts: user.consentementPartageContacts };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as unknown as { role: string; consentementPartageContacts: boolean };
        token.role = u.role;
        token.consentementPartageContacts = u.consentementPartageContacts;
      }
      // Lors d'un update() côté client, relire le consentement en base
      if (trigger === "update" && token.sub) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { consentementPartageContacts: true },
        });
        if (fresh) token.consentementPartageContacts = fresh.consentementPartageContacts;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as { id: string; role: string; consentementPartageContacts: boolean };
        u.id = token.sub!;
        u.role = token.role as string;
        u.consentementPartageContacts = token.consentementPartageContacts as boolean;
      }
      return session;
    },
  },
};
