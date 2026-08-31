import type { Metadata } from "next";
import { NavBar } from "@/components/NavBar";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in — Allync",
};

export default function LoginPage() {
  return (
    <>
      <NavBar />
      <AuthShell variant="login">
        <LoginForm />
      </AuthShell>
    </>
  );
}
