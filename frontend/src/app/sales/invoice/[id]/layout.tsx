import type { Metadata } from 'next';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Invoice #${resolvedParams.id} - GreenLedger`,
    description: `View details for invoice #${resolvedParams.id}`,
  };
}

export default async function Layout({ children, params }: LayoutProps) {
  await params; // Wait for params to resolve
  return <>{children}</>;
}