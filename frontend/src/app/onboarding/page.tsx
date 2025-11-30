'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CompanyForm from '@/components/onboarding/CompanyForm';
import ProfileUpload from '@/components/onboarding/ProfileUpload';
import { checkOnboardingComplete } from '@/lib/utils/onboarding';
import { Loader } from '@/components/ui/loader';

export default function OnboardingPage() {
    const [step, setStep] = useState<'company' | 'profile'>('company');
    const [isChecking, setIsChecking] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if onboarding is already complete
        const checkOnboarding = async () => {
            try {
                const isComplete = await checkOnboardingComplete();
                if (isComplete) {
                    // If onboarding is complete, redirect to dashboard
                    router.push('/dashboard');
                } else {
                    // If not complete, show onboarding form
                    setIsChecking(false);
                }
            } catch (error) {
                // If check fails, assume onboarding is not complete
                setIsChecking(false);
            }
        };

        checkOnboarding();
    }, [router]);

    if (isChecking) {
        return <Loader />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
                {step === 'company' && (
                    <CompanyForm onComplete={() => setStep('profile')} />
                )}
                {step === 'profile' && (
                    <ProfileUpload />
                )}
            </div>
        </div>
    );
}
