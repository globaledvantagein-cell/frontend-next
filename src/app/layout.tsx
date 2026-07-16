import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Providers from "@/components/Providers";
import Layout from "@/components/Layout";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://englishjobsgermany.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "English Jobs in Germany — No German Required",
    template: "%s — English Jobs Germany",
  },
  description:
    "Browse English-speaking jobs in Germany. No German language required — every role is checked before it is listed.",
  openGraph: {
    siteName: "English Jobs in Germany",
    type: "website",
    images: ["/logo.jpeg"],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {/* Layout (site chrome) reads useSearchParams via the router shim,
              which requires a Suspense boundary during prerender. */}
          <Suspense fallback={null}>
            <Layout>{children}</Layout>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
