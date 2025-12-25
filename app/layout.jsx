import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Mend: AI Mental Health Counsellor",
  description: "Your compassionate AI companion for mental health support. Get personalized guidance, therapeutic insights, and emotional support in a safe, judgment-free space.",
  keywords: [
    "mental health",
    "AI counsellor",
    "therapy",
    "emotional support",
    "anxiety help",
    "stress management",
    "mental wellness",
    "AI therapist",
    "psychological support",
    "Mend AI"
  ],
  authors: [{ name: "Mend Team" }],
  creator: "Mend",
  publisher: "Mend",
  openGraph: {
    title: "Mend: AI Mental Health Counsellor",
    description: "Your compassionate AI companion for mental health support. Get personalized guidance, therapeutic insights, and emotional support.",
    siteName: 'Mend AI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Mend: AI Mental Health Counsellor",
    description: "Your compassionate AI companion for mental health support.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'health',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="Mend" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />

          <main className="pt-6">
            {children}
          </main>

          {/* <Footer /> */}
        </ThemeProvider>
      </body>
    </html>
  );
}