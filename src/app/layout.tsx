import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SWRProvider } from "@/lib/swr-config";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "VidyaSetu — Classroom & Quiz Platform",
  description: "A modern classroom and quiz platform for schools. Teachers create quizzes, students learn better.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VidyaSetu",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FACC15",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SWRProvider>
          <ServiceWorkerRegistration />
          {children}
          <Toaster position="top-right" richColors />
        </SWRProvider>
      </body>
    </html>
  );
}
