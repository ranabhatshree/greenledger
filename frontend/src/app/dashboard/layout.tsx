import type { Metadata } from 'next';
import { AppLayout } from "@/components/layout/app-layout";

export const metadata: Metadata = {
  title: 'Dashboard - Your Business Overview',
  description: 'View your total revenue, expenses, transactions, and more in the comprehensive dashboard.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
} 