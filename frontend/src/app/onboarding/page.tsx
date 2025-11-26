'use client';

import { useState } from 'react';
import CompanyForm from '@/components/onboarding/CompanyForm';
import ProfileUpload from '@/components/onboarding/ProfileUpload';

export default function OnboardingPage() {
    const [step, setStep] = useState<'company' | 'profile'>('company');

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
