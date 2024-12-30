import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - GreenLedger',
  description: 'Sign in to your GreenLedger account',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
} 