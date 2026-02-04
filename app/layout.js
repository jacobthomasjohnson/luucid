import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AudioCatalogLoader from "../components/AudioCatalogLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Luucid",
  description: "A clean, minimal meditation timer.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-zinc-900`}
      >
        <AudioCatalogLoader />
        {children}
      </body>
    </html>
  );
}
