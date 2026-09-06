import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Providers from "@/components/Providers";
import Layout from "@/components/Layout";
import JsonLd from "@/components/seo/JsonLd";
import { lightVars, darkVars } from "@/theme/themes";

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

// Runs before first paint. Every colour on the site is a CSS variable that
// ThemeProvider sets from JS; without this the server HTML paints with the
// variables undefined (white page, black text, no borders) and then snaps to
// the real palette after hydration — a visible flash on every fresh tab.
const THEME_BOOT_SCRIPT = `(function(){try{var l=${JSON.stringify(lightVars)},d=${JSON.stringify(darkVars)};var m=null;try{m=localStorage.getItem('ej-theme')}catch(e){}if(m!=='dark'&&m!=='light'){m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}var v=m==='dark'?d:l,r=document.documentElement;for(var k in v){r.style.setProperty(k,v[k])}r.setAttribute('data-theme',m)}catch(e){}})();`;

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
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
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
