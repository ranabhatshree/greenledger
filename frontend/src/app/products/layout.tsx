import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Manage your product inventory and catalog',
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 