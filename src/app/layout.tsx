import type { Metadata } from "next";
import { Space_Grotesk, Manrope, JetBrains_Mono, Baloo_Da_2, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const balooDa2 = Baloo_Da_2({
  variable: "--font-baloo",
  subsets: ["bengali", "latin"],
  weight: ["600", "700"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Allync — One Platform. Every Arena.",
  description:
    "Allync is the infrastructure behind competitive gaming — communities, clubs, and tournaments for players, organizers, and brand sponsors alike. Starting with eFootball.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${manrope.variable} ${jetbrains.variable} ${balooDa2.variable} ${hindSiliguri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
