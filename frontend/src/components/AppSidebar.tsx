import { Home, TrendingUp, DollarSign, Users, Tag, Sliders, FileText } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: TrendingUp, label: "Demand Forecast", path: "/forecast" },
  { icon: DollarSign, label: "Smart Pricing", path: "/pricing" },
  { icon: Users, label: "Competitor Watch", path: "/competitors" },
  { icon: Tag, label: "Promo Simulator", path: "/promo" },
  { icon: Sliders, label: "What-If Scenarios", path: "/scenarios" },
  { icon: FileText, label: "Auto-Pricing Rules", path: "/rules" },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <div className="px-6 py-4">
          <h2 className="text-xl font-bold">RetailMind</h2>
          <p className="text-xs text-muted-foreground">Dashboard</p>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={location === item.path}>
                    <Link href={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}