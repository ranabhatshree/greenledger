import type { Metadata } from 'next';
import { getBusinessName } from '@/lib/utils';
import '../../../../globals.css';
import './print.css';

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
    title: `Print Invoice #${resolvedParams.id} - ${businessName}`,
    description: `Printable invoice from ${businessName}`,
  };
}

export default async function PrintLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body className="bg-white">
        <main className="print-optimized">
          {children}
        </main>
      </body>
    </html>
  );
} 