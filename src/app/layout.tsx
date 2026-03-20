import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mycel",
  description: "Ideas spread quietly.",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-text-primary font-serif min-h-screen">
        {children}
      </body>
    </html>
  );
}
