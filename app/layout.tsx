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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Ruang Kita — Property Management for Malaysian Landlords",
  description:
    "Track tenants, collect rent, and handle maintenance requests for every property you manage — built for landlords and property managers in Malaysia.",
  keywords: [
    "property management Malaysia",
    "landlord software",
    "rent tracking",
    "tenant management",
    "maintenance requests",
  ],
  openGraph: {
    title: "Ruang Kita — Property Management for Malaysian Landlords",
    description:
      "Track tenants, collect rent, and handle maintenance requests for every property you manage.",
    type: "website",
    locale: "en_MY",
  },
  twitter: {
    card: "summary",
    title: "Ruang Kita — Property Management",
    description: "Track tenants, collect rent, and handle maintenance requests.",
  },
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
