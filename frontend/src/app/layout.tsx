import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1a1f2e",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://gitmindhq.vercel.app/?v=1"),

  title: {
    default: "GitMind — AI Repository Intelligence",
    template: "%s | GitMind",
  },
  description:
    "GitMind analyzes any public GitHub repository with AI. Get instant commit explanations, risk detection, health scores, and engineering intelligence. Free, no signup required.",

  keywords: [
    "github repository analyzer",
    "AI code review",
    "commit analysis",
    "repository health score",
    "git commit intelligence",
    "code risk detection",
    "github AI tool",
    "open source analyzer",
    "developer tools",
    "engineering intelligence",
  ],

  authors: [{ name: "Arun C", url: "https://github.com/ArunChandrasekar07" }],
  creator: "Arun C",
  publisher: "GitMind",

  // ── Open Graph (Facebook, LinkedIn, WhatsApp, Discord) ────────────
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gitmindhq.vercel.app/?v=1",
    siteName: "GitMind",
    title: "GitMind — AI Repository Intelligence",
    description:
      "Paste any GitHub URL. AI explains every commit, detects risky changes, and scores repository health. Free forever.",
    images: [
      {
        url: "/seo.png",
        width: 1200,
        height: 630,
        alt: "GitMind — AI Repository Intelligence Platform",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X Card ──────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    site: "@gitmindhq",
    creator: "@arunchandrasekar",
    title: "GitMind — AI Repository Intelligence",
    description:
      "Paste any GitHub URL. AI explains every commit, detects risky changes, and scores repository health. Free forever.",
    images: ["/seo.png"],
  },

  // ── Robots ────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Icons ─────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },

  // ── Manifest ──────────────────────────────────────────────────────
  manifest: "/manifest.json",

  // ── Canonical ─────────────────────────────────────────────────────
  alternates: {
    canonical: "https://gitmindhq.vercel.app/?v=1",
  },

  // ── App specific ──────────────────────────────────────────────────
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data — JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "GitMind",
              url: "https://gitmindhq.vercel.app/?v=1",
              description:
                "AI-powered GitHub repository intelligence. Analyze commits, detect risks, and score repository health instantly.",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Person",
                name: "Arun C",
                url: "https://github.com/ArunChandrasekar07",
              },
              screenshot: "https://gitmindhq.vercel.app/seo.png",
              featureList: [
                "AI commit analysis",
                "Risk detection",
                "Repository health scoring",
                "Real-time streaming",
                "Free forever",
              ],
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(220 14% 10%)",
              border: "1px solid hsl(220 12% 16%)",
              color: "hsl(210 20% 88%)",
              fontSize: "13px",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}