import { useAuth } from "@/contexts/AuthContext";
import { useLocation, NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  Settings,
  FileText,
  UserCheck,
  Clock,
  Shield,
  Home,
  MessageSquare
} from "lucide-react";

const getMenuItemsForRole = (role: string) => {
  const baseItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "AI Chat", url: "/dashboard/ai-chat", icon: MessageSquare }
  ];

  switch (role) {
    case 'admin':
      return [
        ...baseItems,
        { title: "User Management", url: "/dashboard/users", icon: UserCheck },
        { title: "Employee Management", url: "/dashboard/employees", icon: Users },
        { title: "Onboarding", url: "/dashboard/onboarding", icon: UserCheck },
        { title: "Leave Management", url: "/dashboard/leave", icon: Calendar },
        { title: "Payroll & Benefits", url: "/dashboard/payroll", icon: DollarSign },
        { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
        { title: "Audit Logs", url: "/dashboard/audit", icon: FileText },
        { title: "Settings", url: "/dashboard/settings", icon: Settings }
      ];
    case 'hr':
      return [
        ...baseItems,
        { title: "Employee Management", url: "/dashboard/employees", icon: Users },
        { title: "Onboarding", url: "/dashboard/onboarding", icon: UserCheck },
        { title: "Leave Management", url: "/dashboard/leave", icon: Calendar },
        { title: "Payroll & Benefits", url: "/dashboard/payroll", icon: DollarSign },
        { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
        { title: "User Management", url: "/dashboard/users", icon: UserCheck }
      ];
    case 'manager':
      return [
        ...baseItems,
        { title: "Team Overview", url: "/dashboard/team", icon: Users },
        { title: "Leave Requests", url: "/dashboard/leave-requests", icon: Clock },
        { title: "Employee Progress", url: "/dashboard/progress", icon: BarChart3 }
      ];
    case 'employee':
    default:
      return [
        ...baseItems,
        { title: "My Onboarding", url: "/dashboard/onboarding", icon: UserCheck },
        { title: "My Profile", url: "/dashboard/profile", icon: Users },
        { title: "My Requests", url: "/dashboard/my-requests", icon: FileText },
        { title: "My Tickets", url: "/dashboard/my-tickets", icon: Clock }
      ];
  }
};

export const AppSidebar = () => {
  const { profile } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  
  const menuItems = getMenuItemsForRole(profile?.role || 'employee');
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" : "hover:bg-muted/50";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary rounded-lg">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-semibold text-foreground">HR Connect</h2>
                <p className="text-xs text-muted-foreground capitalize">{profile?.role} Panel</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="px-2">
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};