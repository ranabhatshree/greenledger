'use client';

import RegisterForm from '@/components/auth/RegisterForm';
import { Card } from '@/components/ui/card';
import { BarChart, LayoutDashboard, LineChart } from 'lucide-react';

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen">
            {/* Left side - Brand and Benefits */}
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-green-600 to-green-800 text-white flex-col">
                <div className="p-8 flex-1 flex flex-col justify-center items-center">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold mb-2">GreenLedger</h1>
                        <p className="text-green-100">Join the sustainable accounting revolution</p>
                    </div>

                    <div className="space-y-8 max-w-md">
                        <div className="flex items-start space-x-3">
                            <div className="bg-white/10 p-3 rounded-full">
                                <LayoutDashboard className="h-6 w-6 text-green-100" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-xl">Get Started Quickly</h3>
                                <p className="text-green-100 text-sm mt-1">Set up your company profile and start managing finances in minutes.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="bg-white/10 p-3 rounded-full">
                                <BarChart className="h-6 w-6 text-green-100" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-xl">Powerful Analytics</h3>
                                <p className="text-green-100 text-sm mt-1">Gain insights into your business performance with advanced reporting.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="bg-white/10 p-3 rounded-full">
                                <LineChart className="h-6 w-6 text-green-100" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-xl">Eco-Friendly Focus</h3>
                                <p className="text-green-100 text-sm mt-1">Monitor your environmental impact and make data-driven decisions.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 text-center text-sm text-green-100">
                    &copy; {new Date().getFullYear()} GreenLedger. All rights reserved.
                </div>
            </div>

            {/* Right side - Registration Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-gray-50">
                <Card className="w-full max-w-md p-8 shadow-lg border-0">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-green-800">Create Account</h1>
                        <p className="text-sm text-gray-500 mt-2">
                            Sign up to get started with GreenLedger
                        </p>
                    </div>

                    <RegisterForm />
                </Card>
            </div>
        </div>
    );
}
