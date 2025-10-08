"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  Home,
  ChevronRight,
  ChevronsUpDown,
  MoreHorizontal,
  LogOut,
  Monitor,
  User
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface Project {
  id: string;
  name: string;
  logo_url?: string;
}

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  user?: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  } | null;
  projects?: Project[];
  supabaseClient?: ReturnType<typeof createSupabaseBrowserClient> | null;
}

export default function Sidebar({ collapsed = false, onToggle, user, projects = [], supabaseClient }: SidebarProps) {
  const [homeExpanded, setHomeExpanded] = useState(true);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Get user's name initials
  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Get user's display name
  const getUserName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "User";
  };

  // Get latest 5 projects
  const latestProjects = projects.slice(0, 5);

  // Determine active states
  const isDashboardActive = pathname === '/dashboard';
  const isProjectPage = pathname.startsWith('/project/');
  const isDesktopSyncActive = pathname === '/settings/desktop-sync';
  const currentProjectId = isProjectPage ? pathname.split('/project/')[1] : null;

  // Handle logout
  const handleLogout = async () => {
    console.log("Logout clicked, supabaseClient:", !!supabaseClient);
    
    try {
      if (supabaseClient) {
        console.log("Signing out...");
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
          console.error("Logout error:", error);
          alert("Logout failed: " + error.message);
          return;
        }
        console.log("Sign out successful");
        
        // Clear beta access cookie
        document.cookie = "beta-access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        console.log("Beta access cookie cleared");
        
        // Close the logout menu
        setShowLogoutMenu(false);
        
        // Force redirect to login (use window.location for guaranteed redirect)
        window.location.href = "/login";
      } else {
        console.error("No supabaseClient available");
        alert("Logout failed: No authentication client available");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  // Handle logo/home click
  const handleLogoClick = () => {
    router.push("/dashboard");
  };

  return (
    <div className={`bg-neutral-50 flex flex-col h-screen transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo - restricted to top level */}
      <div className="p-4 h-24 flex items-center justify-center">
        <button 
          onClick={handleLogoClick}
          className="relative cursor-pointer hover:opacity-80 transition-opacity"
          style={{ width: '160px', height: '64px' }}
        >
          <Image
            src="/Fotoflo-logo-black.png"
            alt="Fotoflo"
            fill
            priority
            sizes="160px"
            className="object-contain"
          />
        </button>
      </div>

      {/* Empty space - aligned with page header */}
      <div className="h-16"></div>

      {/* Content - aligned with page content */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {/* Application Section */}
        <div className="space-y-2">
          <div className="px-2 py-1">
            <p className="text-xs font-medium text-neutral-950 opacity-70">
              Application
            </p>
          </div>
          
          <div className="space-y-1">
            {/* Home Dropdown */}
            <div className="space-y-1">
              <div className="flex">
                <Link href="/dashboard" className="flex-1">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start h-8 px-2 hover:bg-neutral-200 ${
                      isDashboardActive ? 'bg-neutral-100' : ''
                    }`}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    {!collapsed && (
                      <span className="flex-1 text-left">Home</span>
                    )}
                  </Button>
                </Link>
                {!collapsed && (
                  <Button
                    variant="ghost"
                    className={`h-8 px-1 hover:bg-neutral-200 ${
                      isDashboardActive ? 'bg-neutral-100' : ''
                    }`}
                    onClick={() => setHomeExpanded(!homeExpanded)}
                  >
                    <ChevronRight className={`w-4 h-4 transition-transform ${homeExpanded ? "rotate-90" : ""}`} />
                  </Button>
                )}
              </div>
              
              {homeExpanded && !collapsed && (
                <div className="ml-6 space-y-1 border-l border-neutral-200 pl-4">
                  {latestProjects.length > 0 ? (
                    latestProjects.map((project) => {
                      const isCurrentProject = currentProjectId === project.id;
                      return (
                        <Link key={project.id} href={`/project/${project.id}`}>
                          <Button 
                            variant="ghost" 
                            className={`w-full justify-start h-7 px-2 text-sm text-neutral-950 hover:bg-neutral-200 ${
                              isCurrentProject ? 'bg-neutral-100' : ''
                            }`}
                          >
                            {project.name}
                          </Button>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="px-2 py-1 text-xs text-neutral-500">
                      No projects yet
                    </div>
                  )}
                  
                  {projects.length > 5 && (
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-7 px-2 text-sm text-neutral-500 opacity-70"
                    >
                      <MoreHorizontal className="w-4 h-4 mr-1" />
                      More
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Desktop Sync Link */}
            <div className="space-y-1">
              <Link href="/settings/desktop-sync">
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-8 px-2 hover:bg-neutral-200 ${
                    isDesktopSyncActive ? 'bg-neutral-100' : ''
                  }`}
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  {!collapsed && (
                    <span className="flex-1 text-left">Desktop sync</span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - User Profile */}
      <div className="p-2 border-t border-neutral-200 relative">
        <Button 
          variant="ghost" 
          className="w-full justify-start h-auto p-2"
          onClick={() => setShowLogoutMenu(!showLogoutMenu)}
        >
          <Avatar className="w-8 h-8 mr-2">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-neutral-900 text-white text-xs font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-950 truncate">
                {getUserName()}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {user?.email || "user@example.com"}
              </p>
            </div>
          )}
          {!collapsed && (
            <ChevronsUpDown className="w-4 h-4 flex-shrink-0" />
          )}
        </Button>
        
        {/* User Menu */}
        {showLogoutMenu && !collapsed && (
          <div className="absolute bottom-full left-2 right-2 mb-2 bg-white border border-neutral-200 rounded-lg shadow-lg py-1">
            <Link href="/profile">
              <Button
                variant="ghost"
                className="w-full justify-start h-8 px-3 text-sm text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50"
                onClick={() => setShowLogoutMenu(false)}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}