import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { Leaf } from "lucide-react";
import { AiStatusBadge } from "@/components/ai-status-badge";
import "./globals.css";

// Rename on interview day.
const APP_NAME = "Slice";
const APP_TAGLINE = "Track, draft and review records with AI assistance";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Leaf className="size-4" aria-hidden />
              </span>
              <span className="font-semibold tracking-tight">{APP_NAME}</span>
            </div>
            <AiStatusBadge />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
        <Toaster richColors position="bottom-right" closeButton />
      </body>
    </html>
  );
}
