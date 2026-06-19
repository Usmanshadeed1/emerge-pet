import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "OWNER" | "ADMIN";
      onboardingCompleted: boolean;
      isActive: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "OWNER" | "ADMIN";
    onboardingCompleted: boolean;
    isActive: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    role: "OWNER" | "ADMIN";
    onboardingCompleted: boolean;
    isActive: boolean;
  }
}
