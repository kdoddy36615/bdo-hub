"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Clock,
  Skull,
  Users,
  Shield,
  BookOpen,
  Library,
  Archive,
  Pickaxe,
  MessageCircleQuestion,
  Settings,
  Swords,
  Crosshair,
  Newspaper,
  FlaskConical,
  Target,
  ListChecks,
  CheckSquare,
  Timer,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Daily Checklist", href: "/checklist", icon: CheckSquare },
  { title: "Progression", href: "/progression", icon: TrendingUp },
  { title: "Activities", href: "/activities", icon: Clock },
  { title: "Boss Tracker", href: "/bosses", icon: Skull },
  { title: "Characters", href: "/characters", icon: Users },
  { title: "Gear Profile", href: "/gear", icon: Shield },
  { title: "Playbooks", href: "/playbooks", icon: BookOpen },
  { title: "Resources", href: "/resources", icon: Library },
  { title: "Storage", href: "/storage", icon: Archive },
  { title: "Grind Spots", href: "/grind", icon: Crosshair },
  { title: "Grind Log", href: "/grind-log", icon: Timer },
  { title: "Gathering", href: "/gathering", icon: Pickaxe },
  { title: "News & Events", href: "/news", icon: Newspaper },
  { title: "Buffs & Guides", href: "/buffs", icon: FlaskConical },
  { title: "Priorities", href: "/priorities", icon: Target },
  { title: "Mentor Q&A", href: "/mentor", icon: MessageCircleQuestion },
  { title: "Status & Roadmap", href: "/status", icon: ListChecks },
  { title: "Settings", href: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 py-3"
          onClick={() => isMobile && setOpenMobile(false)}
        >
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
                    render={
                      <Link
                        href={item.href}
                        onClick={() => isMobile && setOpenMobile(false)}
                      />
                    }
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
    </Sidebar>
  );
}
