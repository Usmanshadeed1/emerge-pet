import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: (credentials.email as string).toLowerCase().trim() },
        });

        if (!user || !user.passwordHash) return null;
        if (!user.isActive) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id:                  user.id,
          email:               user.email,
          name:                user.name,
          role:                user.role as "OWNER" | "ADMIN",
          onboardingCompleted: user.onboardingCompleted,
          isActive:            user.isActive,
        };
      },
    }),
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Apple({
      clientId:     process.env.APPLE_CLIENT_ID     ?? "",
      clientSecret: process.env.APPLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials" && user.email) {
        const dbUser = await db.user.findUnique({
          where:  { email: user.email },
          select: { isActive: true },
        });
        if (dbUser && !dbUser.isActive) return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.uid                = user.id!;
        token.role               = (user as unknown as Record<string, unknown>).role as "OWNER" | "ADMIN";
        token.onboardingCompleted = (user as unknown as Record<string, unknown>).onboardingCompleted as boolean;
        token.isActive           = ((user as unknown as Record<string, unknown>).isActive ?? true) as boolean;
      } else if (token.sub) {
        const dbUser = await db.user.findUnique({
          where:  { id: token.sub },
          select: { role: true, onboardingCompleted: true, isActive: true },
        });
        if (dbUser) {
          token.role               = dbUser.role;
          token.onboardingCompleted = dbUser.onboardingCompleted;
          token.isActive           = dbUser.isActive;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id                = (token.uid as string | undefined) ?? token.sub ?? "";
      session.user.role              = (token.role as "OWNER" | "ADMIN" | undefined) ?? "OWNER";
      session.user.onboardingCompleted = (token.onboardingCompleted as boolean | undefined) ?? false;
      session.user.isActive          = (token.isActive as boolean | undefined) ?? true;
      return session;
    },
  },
});
