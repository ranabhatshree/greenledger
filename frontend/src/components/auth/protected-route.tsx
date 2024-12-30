'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import { Loader } from '@/components/ui/loader';
import Cookies from 'js-cookie';

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password'];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, isLoading } = useAppSelector((state) => state.auth);
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const cookieToken = Cookies.get('token');
    
    // If on a public path and authenticated, redirect to dashboard
    if ((token || cookieToken) && PUBLIC_PATHS.includes(pathname)) {
      router.push('/dashboard');
      return;
    }

    // If on a protected path and not authenticated, redirect to login
    if (!token && !cookieToken && !PUBLIC_PATHS.includes(pathname)) {
      router.push('/login');
      return;
    }
  }, [token, pathname, router, isHydrated]);

  if (!isHydrated || isLoading) {
    return <Loader />;
  }

  // Don't render protected content until auth check is complete
  if (!token && !PUBLIC_PATHS.includes(pathname)) {
    const cookieToken = Cookies.get('token');
    if (!cookieToken) {
      return null;
    }
  }

  return <>{children}</>;
} 