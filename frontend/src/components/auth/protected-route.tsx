'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import { Loader } from '@/components/ui/loader';
import { checkOnboardingComplete } from '@/lib/utils/onboarding';
import Cookies from 'js-cookie';

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password'];
const ONBOARDING_PATH = '/onboarding';

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
    const isAuthenticated = !!(token || cookieToken);
    
    // If on a public path and authenticated, check onboarding and redirect
    if (isAuthenticated && PUBLIC_PATHS.includes(pathname)) {
      checkOnboardingComplete()
        .then((isComplete) => {
          if (isComplete) {
            router.push('/dashboard');
          } else {
            router.push(ONBOARDING_PATH);
          }
        })
        .catch(() => {
          router.push(ONBOARDING_PATH);
        });
      return;
    }

    // If on a protected path and not authenticated, redirect to login
    if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname) && pathname !== ONBOARDING_PATH) {
      router.push('/login');
      return;
    }

    // If authenticated and trying to access dashboard without onboarding, redirect to onboarding
    if (isAuthenticated && pathname === '/dashboard') {
      checkOnboardingComplete()
        .then((isComplete) => {
          if (!isComplete) {
            router.push(ONBOARDING_PATH);
          }
        })
        .catch(() => {
          router.push(ONBOARDING_PATH);
        });
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