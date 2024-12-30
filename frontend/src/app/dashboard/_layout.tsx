import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of your business performance and key metrics',
};

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 