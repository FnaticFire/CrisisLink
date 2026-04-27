import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CrisisLink | AI-Powered Emergency Response",
  description: "Every second counts. CrisisLink connects people in distress with the nearest emergency responders using AI detection, real-time tracking, and smart dispatch.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
