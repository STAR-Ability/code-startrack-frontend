import { Geist, Geist_Mono } from "next/font/google";
import { getLocale, localizedMetadata } from "@/lib/i18n/server";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { GeometricBackground } from "@/components/layout/geometric-background";

import { TrainingQueryProvider } from "@/components/training/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const generateMetadata = () => localizedMetadata("home");

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GeometricBackground />
        <LocaleProvider initialLocale={locale}>
          <TooltipProvider delay={350}>
            <Toaster limit={3}>
              <TrainingQueryProvider>{children}</TrainingQueryProvider>
            </Toaster>
          </TooltipProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
