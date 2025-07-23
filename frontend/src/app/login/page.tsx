"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, BarChart, LayoutDashboard, LineChart } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { loginUser, clearError } from "@/lib/features/auth/authSlice";
import Image from "next/image";
import Link from "next/link";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  
  // Get auth state from Redux
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Show error toast if login fails
    if (error) {
      toast({
        title: "Error",
        description: "Invalid email or password!",
        variant: "destructive",
      });
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const resultAction = await dispatch(loginUser(formData));
    
    if (loginUser.fulfilled.match(resultAction)) {
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      router.push("/dashboard");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Brand and Benefits */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-green-600 to-green-800 text-white flex-col">
        <div className="p-8 flex-1 flex flex-col justify-center items-center">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2">GreenLedger</h1>
            <p className="text-green-100">Open-source accounting for a sustainable future</p>
          </div>
          
          <div className="space-y-8 max-w-md">
            <div className="flex items-start space-x-3">
              <div className="bg-white/10 p-3 rounded-full">
                <LayoutDashboard className="h-6 w-6 text-green-100" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Intuitive Bookkeeping</h3>
                <p className="text-green-100 text-sm mt-1">Streamline your financial processes with our user-friendly interface.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-white/10 p-3 rounded-full">
                <BarChart className="h-6 w-6 text-green-100" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Comprehensive Reporting</h3>
                <p className="text-green-100 text-sm mt-1">Generate detailed financial reports with just a few clicks.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-white/10 p-3 rounded-full">
                <LineChart className="h-6 w-6 text-green-100" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Sustainability Metrics</h3>
                <p className="text-green-100 text-sm mt-1">Track your organization's environmental impact alongside finances.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 text-center text-sm text-green-100">
          &copy; {new Date().getFullYear()} GreenLedger. All rights reserved.
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <Card className="w-full max-w-md p-8 shadow-lg border-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-800">Welcome Back</h1>
            <p className="text-sm text-gray-500 mt-2">
              Enter your credentials to access your account
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className="h-12"
                required
              />
            </div>
            
            <div className="space-y-2 relative">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-green-600 hover:text-green-800">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link href="/register" className="text-green-600 hover:text-green-800 font-medium">
                Sign up
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}