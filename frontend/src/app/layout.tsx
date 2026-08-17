import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "CloudServiceStore", template: "%s | CloudServiceStore" },
  description: "Dịch vụ VPS, Hosting và hạ tầng Cloud cho doanh nghiệp.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "CloudServiceStore",
    title: "CloudServiceStore",
    description: "Hạ tầng Cloud vững vàng cho mọi chặng tăng trưởng.",
    images: [{ url: "/branding/cloud-service-store-logo.png", alt: "CloudServiceStore - Hạ tầng Cloud vững vàng" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CloudServiceStore",
    description: "Hạ tầng Cloud vững vàng cho mọi chặng tăng trưởng.",
    images: ["/branding/cloud-service-store-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
