import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/ui/Sidebar";

export const metadata: Metadata = {
  title: "CarbonFlow AI",
  description: "Predict and prevent avoidable emissions before the activity happens.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen md:flex">
          <Sidebar />
          <main className="min-w-0 flex-1 p-5 md:p-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}