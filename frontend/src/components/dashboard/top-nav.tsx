"use client";

import { useState, useEffect } from "react";
import { Search, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
import { getThemeColor } from "@/lib/utils";
import Image from "next/image";
import { getProfile, type UserProfile } from "@/lib/api/userProfile";
import { getCompanySettings } from "@/lib/api/companySettings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopNavProps {
  onMenuClick: () => void;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}

export function TopNav({ onMenuClick, onToggleCollapse, isCollapsed }: TopNavProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [companyName, setCompanyName] = useState<string>("GreenLedger");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoadingUser(true);
        const response = await getProfile();
        setUser(response.user);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    const fetchCompanySettings = async () => {
      try {
        const response = await getCompanySettings();
        if (response.company?.companyName) {
          setCompanyName(response.company.companyName);
        }
      } catch (error) {
        console.error('Failed to fetch company settings:', error);
        // Keep default "GreenLedger" on error
      }
    };

    fetchUserProfile();
    fetchCompanySettings();
  }, []);

  const handleProfileClick = () => {
    router.push("/profile");
  };
  const handleSettingsClick = () => {
    router.push("/settings");
  };
  
  const handleLogoutClick = () => {
    dispatch(logout());
    router.push("/login"); // Redirect to login page after logout
  };

  // Get profile picture URL
  const getProfilePictureUrl = () => {
    if (!user?.profilePicture) {
      return "https://mir-s3-cdn-cf.behance.net/project_modules/hd/d95c1f148207527.62d1246c25004.jpg";
    }
    
    // If it's already a full URL, return as-is
    if (user.profilePicture.startsWith('http')) {
      return user.profilePicture;
    }
    
    // Convert relative URL to absolute URL
    return `${process.env.NEXT_PUBLIC_BASE_URL}${user.profilePicture}`;
  };

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b bg-white px-4 py-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Desktop sidebar collapse button */}
          {/* <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button> */}
          
          <h1 className="text-xl font-bold" style={{ color: getThemeColor() }}>
            {companyName}
          </h1>
          <div className="relative ml-4 hidden lg:block"> 
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="w-96 pl-10"
              placeholder="Search..."
              type="search"
              style={{ borderColor: getThemeColor() }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 px-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {isLoadingUser ? (
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse cursor-pointer" />
              ) : (
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarImage 
                    src={getProfilePictureUrl()} 
                    alt={user?.name || "User Avatar"}
                    onError={(e) => {
                      // Hide image on error, fallback will show
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              )}
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