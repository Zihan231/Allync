import type { Metadata } from "next";
import { Space_Grotesk, Manrope, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { SessionProvider } from "@/lib/session/SessionContext";
import { NavigationProgress } from "@/components/common/NavigationProgress";
import { Providers } from "./providers";
import { Suspense } from "react";

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

// AdorshoLipi (self-hosted — it isn't on Google Fonts). It ships a single
// weight, so heavier text uses the browser's synthetic bold. Only needed when
// the locale is "bn", so it isn't preloaded on every page.
const adorshoLipi = localFont({
  src: "../fonts/AdorshoLipi.woff2",
  variable: "--font-adorsho-lipi",
  weight: "400",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "ALLYNQ — One Platform. Every Arena.",
  description:
    "ALLYNQ is the infrastructure behind competitive gaming — communities, clubs, and tournaments for players, organizers, and brand sponsors alike. Starting with eFootball.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${manrope.variable} ${jetbrains.variable} ${adorshoLipi.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink" suppressHydrationWarning>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <Providers>
          <LanguageProvider>
            <SessionProvider>{children}</SessionProvider>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
