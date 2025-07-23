import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password - GreenLedger',
  description: 'Reset your GreenLedger account password',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 