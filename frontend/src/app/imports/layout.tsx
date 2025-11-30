import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Imports',
  description: 'Manage your import records and invoices',
};

export default function ImportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

