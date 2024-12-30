import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parties',
  description: 'Manage your business partners, vendors, and customers',
};

export default function PartiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 