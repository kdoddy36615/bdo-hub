import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BDO Command Center",
    template: "%s | BDO Command Center",
  },
  description:
    "Personal progression tracker, gear planner, boss timers, grind spots, and knowledge hub for Black Desert Online.",
  keywords: [
    "BDO",
    "Black Desert Online",
    "gear tracker",
    "boss timer",
    "grind spots",
    "progression",
  ],
  authors: [{ name: "Kevin" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "BDO Command Center",
    description:
      "Personal progression tracker, gear planner, boss timers, grind spots, and knowledge hub for Black Desert Online.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var old = localStorage.getItem('theme');
                if (old && !localStorage.getItem('bdo-theme')) {
                  localStorage.setItem('bdo-theme', old === 'light' ? 'dawn' : 'midnight');
                  localStorage.removeItem('theme');
                }
                var theme = localStorage.getItem('bdo-theme') || 'midnight';
                document.documentElement.setAttribute('data-theme', theme);
                var dark = ['midnight','crimson','ocean','forest','violet','oled'];
                if (dark.indexOf(theme) !== -1) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
