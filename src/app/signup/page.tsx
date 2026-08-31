import type { Metadata } from "next";
import { NavBar } from "@/components/NavBar";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create your account — Allync",
};

export default function SignupPage() {
  return (
    <>
      <NavBar />
      <AuthShell variant="signup">
        <SignupForm />
      </AuthShell>
    </>
  );
}
