"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { loginUser, clearError } from "@/lib/features/auth/authSlice";

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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your credentials to access your account
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="space-y-2 relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
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
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}