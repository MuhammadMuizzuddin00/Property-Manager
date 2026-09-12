import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Fraunces } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Ruang Kita — Property Management",
  description: "Track tenants, rent, and maintenance across your properties.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={fraunces.variable}>
        <body className="min-h-screen bg-[#FAF8F4] text-gray-900">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
