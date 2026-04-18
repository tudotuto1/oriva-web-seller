import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oriva — Portail Vendeur",
  description: "Interface de gestion vendeur Oriva",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="bg-oriva-black text-oriva-cream font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#161616",
              color: "#F5F0E8",
              border: "1px solid #222222",
              borderRadius: "8px",
              fontFamily: "var(--font-dm-sans)",
            },
            success: {
              iconTheme: { primary: "#5BBF8A", secondary: "#161616" },
            },
            error: {
              iconTheme: { primary: "#E55B5B", secondary: "#161616" },
            },
          }}
        />
      </body>
    </html>
  );
}
