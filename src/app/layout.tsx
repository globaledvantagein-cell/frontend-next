import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Providers from "@/components/Providers";
import Layout from "@/components/Layout";
import JsonLd from "@/components/seo/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://englishjobsgermany.com";

// Sitewide entity schema — tells Google (and AI answer engines) who this site
// IS, once, on every page. Organization powers the brand knowledge panel;
// WebSite associates the domain with the brand name.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "English Jobs in Germany",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.jpeg`,
  sameAs: [
    "https://www.linkedin.com/company/english-jobs-in-germany",
    "https://x.com/EngJobsgermany",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@englishjobsgermany.com",
    contactType: "customer support",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "English Jobs in Germany",
  url: SITE_URL,
};

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
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
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
