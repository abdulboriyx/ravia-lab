import type { Metadata } from "next";
import Link from "next/link";
import { SiteControls } from "@/components/SiteControls";
import "./globals.css";
import "./site.css";

export const metadata: Metadata = {
  title: "Ravia",
  description: "An independent research lab exploring minds, intelligence, and computation."
};

const themeScript = `
(() => {
  try {
    const stored = window.localStorage.getItem("ravia-theme");
    const theme = stored === "dark" ? "dark" : "light";
    document.documentElement.dataset.siteTheme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.siteTheme = "light";
    document.documentElement.style.colorScheme = "light";
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
      <body className="raviaBody">
        <div className="paperFrame">
        <header className="raviaHeader" aria-label="Site header">
          <Link className="raviaBrand" href="/" aria-label="Ravia home">
            <span className="emblem" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="brandWords"><strong>ravia</strong><small>independent research lab</small></span>
          </Link>
          <nav className="raviaNav" aria-label="Primary navigation">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/research">Research</Link>
            <Link href="/publications">Publications</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/lab-notebook">Lab Notebook</Link>
            <Link href="/cv">CV</Link>
          </nav>
          <SiteControls />
        </header>
        {children}
        </div>
      </body>
    </html>
  );
}
