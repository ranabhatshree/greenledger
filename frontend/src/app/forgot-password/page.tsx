"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import axiosInstance from "@/lib/api/axiosInstance";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosInstance.post('/auth/reset-password', { email });
      
      if (response.status === 200) {
        setIsEmailSent(true);
        toast({
          title: "Success",
          description: "Password reset email sent successfully",
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to send reset email";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 shadow-lg border-0">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-800 mb-4">Check Your Email</h1>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              If you don't see the email, check your spam folder or try again.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setIsEmailSent(false);
                  setEmail("");
                }}
                variant="outline" 
                className="w-full"
              >
                Try Different Email
              </Button>
              <Link href="/login">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-8">
          <div className="text-center space-y-4">
            <Image
              src="/images/logo_large.png"
              alt="GreenLedger Logo"
              width={120}
              height={120}
              className="mx-auto"
            />
            <h2 className="text-4xl font-bold text-green-800">
              {process.env.NEXT_PUBLIC_APP_NAME || "GreenLedger"}
            </h2>
            <p className="text-xl text-gray-600 max-w-md">
              Reset your password securely and get back to managing your business
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md p-8 shadow-lg border-0">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-green-800">Forgot Password?</h1>
              <p className="text-sm text-gray-500 mt-2">
                Enter your email address and we'll send you a link to reset your password
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-12 pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              
              <div className="text-center">
                <Link 
                  href="/login" 
                  className="inline-flex items-center text-sm text-green-600 hover:text-green-800 font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
} 