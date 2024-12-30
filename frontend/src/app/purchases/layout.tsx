import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Purchases',
  description: 'Track and manage your business purchases and inventory',
};

export default function PurchasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 