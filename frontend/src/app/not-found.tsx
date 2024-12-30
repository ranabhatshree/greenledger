"use client";

import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="bg-yellow-100 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
          <Construction className="w-10 h-10 text-yellow-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Page Not Found</h1>
          <p className="text-lg text-gray-600">
            We&apos;re currently building this page. Please check back later!
          </p>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleBackToDashboard}
            className="bg-green-600 hover:bg-green-700"
          >
            Back to Dashboard
          </Button>
        </div>

        <p className="text-sm text-gray-500 pt-8">
          Error 404 - This page is under construction
        </p>
      </div>
    </div>
  );
} 