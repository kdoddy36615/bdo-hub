"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Clock,
  Skull,
  Users,
  BookOpen,
  Library,
  Archive,
  Pickaxe,
  MessageCircleQuestion,
  Settings,
  Swords,
  Sun,
  Moon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTheme } from "@/components/theme-provider";

const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Progression", href: "/progression", icon: TrendingUp },
  { title: "Activities", href: "/activities", icon: Clock },
  { title: "Boss Tracker", href: "/bosses", icon: Skull },
  { title: "Characters", href: "/characters", icon: Users },
  { title: "Playbooks", href: "/playbooks", icon: BookOpen },
  { title: "Resources", href: "/resources", icon: Library },
  { title: "Storage", href: "/storage", icon: Archive },
  { title: "Gathering", href: "/gathering", icon: Pickaxe },
  { title: "Mentor Q&A", href: "/mentor", icon: MessageCircleQuestion },
  { title: "Settings", href: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <Swords className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">BDO Command Center</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme}>
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
