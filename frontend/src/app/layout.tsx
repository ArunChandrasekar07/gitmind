import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "GitMind — Repository Intelligence",
    template: "%s | GitMind",
  },
  description:
    "AI-powered Git repository intelligence platform. Understand any codebase instantly — commit analysis, risk detection, engineering insights.",
  authors: [{ name: "Arun C" }],
  creator: "Arun C",
  keywords: [
    "git",
    "github",
    "repository analysis",
    "commit intelligence",
    "AI code review",
    "engineering analytics",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(222 18% 10%)",
              border: "1px solid hsl(222 14% 18%)",
              color: "hsl(210 20% 94%)",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}