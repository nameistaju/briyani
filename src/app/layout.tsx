import type { Metadata } from "next";
import { Anton, Caveat, Space_Grotesk } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DUMBAAZ — Slow-Fired Copper Handi Biryani",
  description:
    "Interactive 3D dum biryani experience crafted around charcoal-fired copper handis, single-estate spices, and crispy saffron birista.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${spaceGrotesk.variable} ${caveat.variable}`}
    >
      <body className="min-h-screen antialiased selection:bg-turmeric selection:text-ink">
        {children}
      </body>
    </html>
  );
}
