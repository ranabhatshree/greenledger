import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payments',
  description: 'Track and manage your business payments',
};

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 