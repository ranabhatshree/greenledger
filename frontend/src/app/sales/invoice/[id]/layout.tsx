import type { Metadata } from 'next';
import { getBusinessName } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const resolvedParams = await params;
  const businessName = getBusinessName();
  
  return {
    title: `Invoice #${resolvedParams.id} - ${businessName}`,
    description: `Invoice details for ${businessName}`,
  };
}

export default async function Layout({ children, params }: LayoutProps) {
  await params; // Wait for params to resolve
  return <>{children}</>;
}