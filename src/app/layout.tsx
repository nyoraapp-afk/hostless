import type { Metadata, Viewport } from "next";
import { Lora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/cookie-banner";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "hostelyo. — Sois hôte. Sans les corvées.",
    template: "%s · hostelyo.",
  },
  description:
    "hostelyo surveille vos messages Airbnb 24h/24 et ne vous alerte sur WhatsApp que quand votre intervention est nécessaire. Pour conciergeries et gestionnaires de villas.",
  applicationName: "hostelyo.",
  authors: [{ name: "hostelyo." }],
  keywords: [
    "Airbnb",
    "conciergerie",
    "villa",
    "alertes",
    "WhatsApp",
    "monitoring",
    "automatisation",
  ],
  openGraph: {
    title: "hostelyo. — Ne ratez plus les messages importants sur Airbnb",
    description:
      "Une IA surveille votre boîte mail Airbnb 24/7 et vous alerte uniquement sur les vraies urgences. Vos intervenants reçoivent les bonnes alertes au bon moment.",
    type: "website",
    locale: "fr_FR",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#3D1F3D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${lora.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-cream text-ink antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
