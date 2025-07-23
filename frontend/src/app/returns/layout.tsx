import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Returns',
  description: 'Manage your return transactions and credit notes',
};

export default function ReturnsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 