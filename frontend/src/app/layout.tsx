import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { AppFrame } from "@/components/ui/AppFrame";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const metadata: Metadata = {
  title: "CarbonShift · Predict and prevent emissions",
  description:
    "CarbonShift predicts the carbon footprint of a decision before you make it, and shows the lower-carbon choice.",
};

// globals.css reads these variables; without them the app falls back to a default font
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Organic serif for headings: soft, natural, editorial
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["SOFT", "opsz"] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <body>
        <AuthProvider>
          <RequireAuth>
            <AppFrame>{children}</AppFrame>
          </RequireAuth>
        </AuthProvider>
      </body>
    </html>
  );
}
