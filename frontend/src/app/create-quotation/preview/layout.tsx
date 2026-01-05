import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quotation Preview',
  description: 'Preview and print your quotation',
};

export default function QuotationPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

