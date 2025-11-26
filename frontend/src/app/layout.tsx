import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import "./globals.css";
import "react-day-picker/dist/style.css";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GreenLedger - Open Source Accounting Software',
  description: 'Open-source accounting software for a sustainable future. Simplify your financial processes with our user-friendly interface.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster />
          <HotToaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
