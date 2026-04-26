import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { Toaster } from "react-hot-toast";
import FirebaseInit from "@/components/FirebaseInit";
import DebugBar from "@/components/DebugBar";

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
      <body className="min-h-full" suppressHydrationWarning>
        <FirebaseInit />
        <DebugBar />
        <div className="app-container overflow-hidden">
          {children}
          <BottomNav />
        </div>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
