import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Speed Test",
  description: "Test your internet connection speed",
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
