import { NavLink, useLocation } from "react-router-dom";
import {
  Calendar,
  Settings,
  Users,
  BarChart3,
  FileText,
  MessageSquare,
  TrendingUp,
  Plus,
  Bell,
  Home,
  Workflow,
  Palette,
  CheckSquare,
  Package,
  CalendarDays,
  Building2,
  Coffee,
  ShoppingCart,
  Truck,
  Car,
  GitPullRequest,
  CalendarCheck,
  Users2,
  BarChart2,
  ShieldCheck,
  Store
} from "lucide-react";
import { usePermissions } from "@/lib/permissions";
import { useAuth } from "@/hooks/useAuth";
import { useCollaboratorSections } from "@/hooks/useCollaboratorSections";

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

// Section keys must match the collaborator_types strings stored in collaborator_configurations.
// Matching is case-insensitive in getFilteredMenuGroups below.
const menuGroups = [
  {
    title: "Overview",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    alwaysVisible: true, // visible to all roles
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
        color: "text-blue-600",
        hoverColor: "hover:bg-blue-50",
        alwaysVisible: true,
      }
    ]
  },
  {
    title: "Event Planning",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    alwaysVisible: false,
    items: [
      {
        title: "Create Event",
        url: "/dashboard/create-event",
        icon: Plus,
        color: "text-purple-600",
        hoverColor: "hover:bg-purple-50",
        alwaysVisible: false,
      },
      {
        title: "Manage Event",
        url: "/dashboard/manage-event",
        icon: Calendar,
        color: "text-purple-600",
        hoverColor: "hover:bg-purple-50",
        alwaysVisible: false,
      },
      {
        title: "Calendar",
        url: "/dashboard/calendar",
        icon: CalendarDays,
        color: "text-purple-600",
        hoverColor: "hover:bg-purple-50",
        alwaysVisible: false,
      }
    ]
  },
  {
    title: "Project Tools",
    color: "text-green-600",
    bgColor: "bg-green-50",
    alwaysVisible: false,
    items: [
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
        color: "text-green-600",
        hoverColor: "hover:bg-green-50",
        alwaysVisible: false,
      },
      {
        title: "Workflow",
        url: "/dashboard/workflow-dashboard",
        icon: Workflow,
        color: "text-green-600",
        hoverColor: "hover:bg-green-50",
        alwaysVisible: false,
      },
      {
        title: "Project Management",
        url: "/dashboard/project-management",
        icon: CheckSquare,
        color: "text-green-600",
        hoverColor: "hover:bg-green-50",
        alwaysVisible: true, // collaborators need to see their tasks
      },
      {
        title: "Track Progress",
        url: "/dashboard/track-progress",
        icon: TrendingUp,
        color: "text-green-600",
        hoverColor: "hover:bg-green-50",
        alwaysVisible: true, // collaborators can track their own tasks
      }
    ]
  },
  {
    title: "Change Management",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    alwaysVisible: false,
    items: [
      {
        title: "Change Requests",
        url: "/dashboard/change-requests",
        icon: GitPullRequest,
        color: "text-teal-600",
        hoverColor: "hover:bg-teal-50",
        adminOnly: true, // hidden unless admin or host+coordinator
        alwaysVisible: false,
      },
      {
        title: "Timeline Planner",
        url: "/dashboard/cm-timeline",
        icon: CalendarCheck,
        color: "text-teal-600",
        hoverColor: "hover:bg-teal-50",
        alwaysVisible: false,
      },
      {
        title: "Resource Allocation",
        url: "/dashboard/cm-resources",
        icon: Users2,
        color: "text-teal-600",
        hoverColor: "hover:bg-teal-50",
        alwaysVisible: false,
      },
      {
        title: "CM Analytics",
        url: "/dashboard/cm-analytics",
        icon: BarChart2,
        color: "text-teal-600",
        hoverColor: "hover:bg-teal-50",
        alwaysVisible: false,
      },
      {
        title: "DB Verification",
        url: "/dashboard/cm-verification",
        icon: ShieldCheck,
        color: "text-teal-600",
        hoverColor: "hover:bg-teal-50",
        alwaysVisible: false,
      }
    ]
  },
  {
    title: "Resources",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    alwaysVisible: false,
    items: [
      {
        title: "Planning Assets",
        url: "/dashboard/planning-assets",
        icon: Package,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50",
        alwaysVisible: false,
        section: "planning assets",
      },
      {
        title: "Vendors",
        url: "/dashboard/vendors",
        icon: Store,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50",
        alwaysVisible: false,
        section: "vendors",
      },
      {
        title: "Themes",
        url: "/dashboard/themes",
        icon: Palette,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50",
        alwaysVisible: false,
        section: "themes",
      },
      {
        title: "Bookings",
        url: "/dashboard/bookings",
        icon: Calendar,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50",
        alwaysVisible: false,
        section: "bookings",
      },
      {
        title: "Venues",
        url: "/dashboard/venue",
        icon: Building2,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50",
        alwaysVisible: false,
        section: "venues",
      },
      {
        title: "Hospitality",
        url: "/dashboard/hospitality",
        icon: Coffee,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50",
        alwaysVisible: false,
        section: "hospitality",
      },
      {
        title: "Rental Service",
        url: "/dashboard/vendor-service",
        icon: ShoppingCart,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50",
        alwaysVisible: false,
        section: "rental service",
      },
      {
        title: "Vendor Service",
        url: "/dashboard/service-vendor",
        icon: Truck,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50",
        alwaysVisible: false,
        section: "vendor service",
      },
      {
        title: "Transportation",
        url: "/dashboard/transportation",
        icon: Car,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50",
        alwaysVisible: false,
        section: "transportation",
      },
      {
        title: "Entertainment",
        url: "/dashboard/entertainment",
        icon: Users,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50",
        alwaysVisible: false,
        section: "entertainment",
      },
      {
        title: "External Vendor",
        url: "/dashboard/supplier",
        icon: Package,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50",
        alwaysVisible: false,
        section: "external vendor",
      },
      {
        title: "Marketing",
        url: "/dashboard/marketing",
        icon: TrendingUp,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50",
        alwaysVisible: false,
        section: "marketing",
      },
      {
        title: "Generate Reports",
        url: "/dashboard/reports",
        icon: FileText,
        color: "text-orange-600",
        hoverColor: "hover:bg-orange-50",
        alwaysVisible: false,
        section: "reports",
      }
    ]
  },
  {
    title: "Communication",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    alwaysVisible: true,
    items: [
      {
        title: "Team Members",
        url: "/dashboard/collaborate",
        icon: Users,
        color: "text-pink-600",
        hoverColor: "hover:bg-pink-50",
        alwaysVisible: true,
      },
      {
        title: "Comments",
        url: "/dashboard/comments",
        icon: MessageSquare,
        color: "text-pink-600",
        hoverColor: "hover:bg-pink-50",
        alwaysVisible: true,
      },
      {
        title: "Notification",
        url: "/dashboard/notification",
        icon: Bell,
        color: "text-pink-600",
        hoverColor: "hover:bg-pink-50",
        alwaysVisible: true,
      }
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { isAdmin, isCoordinator, permissionLevel } = usePermissions();
  const { userRoles } = useAuth();
  const { assignedSections } = useCollaboratorSections();

  const isActive = (path: string) => currentPath === path;

  const getNavClass = (item: any, isActive: boolean) => {
    const baseClasses = "transition-all duration-200 rounded-lg mx-2 my-1";
    if (isActive) {
      return `${baseClasses} ${item.color} bg-gradient-to-r from-primary/20 to-secondary/20 font-medium border-l-4 border-primary shadow-sm`;
    }
    return `${baseClasses} text-muted-foreground ${item.hoverColor} hover:text-foreground hover:shadow-sm hover:scale-[1.02]`;
  };

  // Check if user has host role with admin or coordinator permission level
  const hasHostWithAdminOrCoordinator = () => {
    const hasHostRole = userRoles.includes('host');
    const hasRequiredPermission = permissionLevel === 'admin' || permissionLevel === 'coordinator';
    return hasHostRole && hasRequiredPermission;
  };

  /**
   * Whether a given section key is accessible to the current user.
   * - null assignedSections = admin = access to all
   * - string[] = only matching sections (case-insensitive)
   */
  const isSectionAllowed = (section?: string): boolean => {
    if (!section) return true;              // no section tag = always visible
    if (assignedSections === null) return true; // admin = unrestricted
    return assignedSections.some(
      (s) => s.toLowerCase() === section.toLowerCase()
    );
  };

  const isCollaborator = permissionLevel === 'coordinator' || permissionLevel === 'viewer';

  const getFilteredMenuGroups = () => {
    return menuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          // Admin-only items (Change Requests)
          if ((item as any).adminOnly) {
            return isAdmin() || hasHostWithAdminOrCoordinator();
          }

          // For collaborators: only show alwaysVisible items + their assigned sections
          if (isCollaborator) {
            if ((item as any).alwaysVisible) return true;
            return isSectionAllowed((item as any).section);
          }

          // Admins and unauthenticated: show everything
          return true;
        }),
      }))
      .filter((group) => group.items.length > 0);
  };

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} border-r bg-gradient-to-b from-background to-muted/30`}
      collapsible="icon"
    >
      <SidebarContent className="px-2 py-4">
        {!collapsed && (
          <div className="mb-6 px-4">
            <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Event Management
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Professional event planning platform
            </p>
          </div>
        )}

        {getFilteredMenuGroups().map((group) => (
          <SidebarGroup key={group.title} className="mb-4">
            {!collapsed && (
              <SidebarGroupLabel className={`text-xs font-semibold ${group.color} uppercase tracking-wider px-4 py-2 ${group.bgColor} rounded-lg mx-2 mb-2`}>
                {group.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) => getNavClass(item, isActive)}
                        >
                          <item.icon className={`h-5 w-5 ${collapsed ? 'mx-auto' : 'mr-3'} transition-colors duration-200`} />
                          {!collapsed && (
                            <span className="text-sm font-medium">{item.title}</span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {collapsed && (
          <div className="mt-auto px-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-secondary mx-auto" />
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}