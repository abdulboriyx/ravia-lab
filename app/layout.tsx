import type { Metadata } from "next";
import { Oxanium, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Ravia Lab",
  description: "A public record of inquiry."
};

const themeScript = `
(() => {
  try {
    const stored = window.localStorage.getItem("theme");
    const theme = stored === "light" || stored === "dark"
      ? stored
      : "dark";
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${oxanium.variable} ${spaceGrotesk.variable}`}>
        <header className="siteHeader" aria-label="Site header">
          <Link className="brand" href="/" aria-label="Ravia Lab home">
            <span className="emblem" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>Ravia Lab</span>
          </Link>
          <nav aria-label="Primary navigation">
            <Link href="/about">About</Link>
            <Link href="/papers">Papers</Link>
            <Link href="/code">Code</Link>
            <ThemeToggle />
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
