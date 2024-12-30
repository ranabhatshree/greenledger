import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Expenses',
  description: 'Manage and track your business expenses',
};

export default function ExpensesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 