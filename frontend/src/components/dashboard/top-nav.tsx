"use client";

import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch } from "@/lib/hooks";
import { logout } from "@/lib/features/auth/authSlice";
import { useRouter } from "next/navigation";

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleProfileClick = () => console.log("Profile clicked");
  const handleSettingsClick = () => console.log("Settings clicked");
  
  const handleLogoutClick = () => {
    dispatch(logout());
    router.push("/login"); // Redirect to login page after logout
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b bg-white px-4 py-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-green-600">GreenLedger</h1>
          <div className="relative ml-4 hidden lg:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="w-96 pl-10"
              placeholder="Search..."
              type="search"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 px-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <img 
                src="https://mir-s3-cdn-cf.behance.net/project_modules/hd/d95c1f148207527.62d1246c25004.jpg" 
                alt="User Avatar"
                className="h-10 w-10 rounded-full cursor-pointer object-cover"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleProfileClick}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleLogoutClick}
                className="text-red-600 focus:text-red-600"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
} 