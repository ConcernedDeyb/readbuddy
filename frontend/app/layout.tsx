import type { ReactNode } from "react";
import "./globals.css";
import "./session-animations.css";

export const metadata = {
  title: "ReadBuddy",
  description:
    "AI-powered reading comprehension assistant for basic education students",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts — Fraunces (serif headings), Figtree (sans-serif body),
            Space Mono (monospace accents/badges). These three are referenced
            throughout every component but were never actually loaded before. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Figtree:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="antialiased font-sans text-[#2B2621] selection:bg-[#E8873A]/20 selection:text-[#2B2621]">
        {children}
      </body>
    </html>
  );
}