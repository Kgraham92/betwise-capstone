import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "BetWise - Better Betting Intelligence",
  description:
    "Real-time sports scores, betting odds, and sentiment analysis for smarter betting decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} antialiased bg-brand-midnight text-foreground font-sans`}
      >
        <AuthProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
          <footer className="border-t border-brand-surface bg-brand-midnight/95">
            <div className="container mx-auto px-6 py-4 text-xs text-brand-muted text-center">
              Sentiment is model-driven and does not represent actual betting
              percentages. BetWise estimates sentiment using a proprietary
              formula.
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
