// Lightweight auth config for Next.js Edge Runtime (middleware).
// Must NOT import Prisma or any Node.js-only modules.
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

export const authEdgeConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid                = user.id!;
        token.role               = (user as unknown as Record<string, unknown>).role as "OWNER" | "ADMIN";
        token.onboardingCompleted = (user as unknown as Record<string, unknown>).onboardingCompleted as boolean;
        token.isActive           = ((user as unknown as Record<string, unknown>).isActive ?? true) as boolean;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id                = (token.uid as string | undefined) ?? token.sub ?? "";
      session.user.role              = (token.role as "OWNER" | "ADMIN" | undefined) ?? "OWNER";
      session.user.onboardingCompleted = (token.onboardingCompleted as boolean | undefined) ?? false;
      session.user.isActive          = (token.isActive as boolean | undefined) ?? true;
      return session;
    },
  },
};

export const { auth } = NextAuth(authEdgeConfig);
