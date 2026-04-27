import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { Toaster } from "react-hot-toast";
import FirebaseInit from "@/components/FirebaseInit";
import DebugBar from "@/components/DebugBar";
import SessionGuard from "@/components/SessionGuard";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "CrisisLink | Emergency Coordination",
  description: "Real-time emergency coordination platform for citizens and responders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full" suppressHydrationWarning>
        <FirebaseInit />
        <SessionGuard />
        <DebugBar />
        <AppShell>
          {children}
        </AppShell>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
