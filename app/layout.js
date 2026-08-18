import "./globals.css";
import { Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "./providers";

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-elegant",
});

const biloxiScript = localFont({
  src: "../public/fonts/BiloxiScript.ttf",
  variable: "--font-biloxi",
});

export const metadata = {
  title: {
    default: "Tamara Valencia Joyas",
    template: "%s | Tamara Valencia Joyas",
  },
  description:
    "Joyería elegante y exclusiva en Ecuador. Anillos, collares, aretes y pulseras en oro, plata y perlas cultivadas.",
  keywords:
    "joyería ecuador, joyas plata, joyas oro, anillos, collares, aretes, pulseras, perlas cultivadas, joyería artesanal, joyas ecuador, joyas quito, joyeria quito",
  authors: [{ name: "Tamara Valencia" }],
  creator: "Tamara Valencia",
  metadataBase: new URL("https://tamaravalenciajoyas.com"),
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_EC",
    url: "https://tamaravalenciajoyas.com",
    siteName: "Tamara Valencia",
  },
};

export default function RootLayout({ children }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: "Tamara Valencia Joyas",
    description:
      "Joyería elegante y exclusiva en Ecuador. Anillos, collares, aretes y pulseras en oro, plata y perlas cultivadas.",
    url: "https://www.tamaravalenciajoyas.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Quito",
      addressCountry: "EC",
    },
    areaServed: {
      "@type": "Country",
      name: "Ecuador",
    },
  };

  return (
    <html lang="es">
      <body
        className={`${cormorant.variable} ${biloxiScript.variable} font-sans antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
