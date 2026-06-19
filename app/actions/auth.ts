"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function credentialsLogin(
  email: string,
  password: string,
  redirectTo: string = "/dashboard"
) {
  console.log("[credentialsLogin] called with email:", email, "redirectTo:", redirectTo);
  try {
    await signIn("credentials", { email, password, redirectTo });
    console.log("[credentialsLogin] signIn completed (no redirect thrown?)");
  } catch (error) {
    console.log("[credentialsLogin] caught error:", (error as Error)?.constructor?.name, (error as Error)?.message?.slice(0, 100));
    if (error instanceof AuthError) {
      console.log("[credentialsLogin] AuthError type:", error.type);
      if (error.type === "CredentialsSignin") {
        return { error: "Incorrect email or password. Please try again." };
      }
      return { error: `Auth error: ${error.type}` };
    }
    // Re-throw so Next.js handles the NEXT_REDIRECT (success case)
    throw error;
  }
}
