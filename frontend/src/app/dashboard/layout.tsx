import type { Metadata } from 'next';
import { DashboardLayoutWrapper } from "@/components/dashboard/dashboard-layout-wrapper";

export const metadata: Metadata = {
  title: 'Dashboard - Your Business Overview',
  description: 'View your total revenue, expenses, transactions, and more in the comprehensive dashboard.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
} 