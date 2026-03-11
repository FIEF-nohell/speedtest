import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Speed Test",
  description: "Test your internet connection speed",
  manifest: "/manifest.json",
  themeColor: "#00d4ff",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Speed Test",
    description: "Test your internet connection speed",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
