"use client";

import { useTheme } from "@/components/theme-provider";
import { THEMES } from "@/lib/themes";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";

function ThemeSwatch({ preview }: { preview: { bg: string; card: string; primary: string; accent: string } }) {
  return (
    <div className="flex h-5 w-10 overflow-hidden rounded border border-foreground/10">
      <div className="flex-1" style={{ backgroundColor: preview.bg }} />
      <div className="flex-1" style={{ backgroundColor: preview.card }} />
      <div className="flex-1" style={{ backgroundColor: preview.primary }} />
      <div className="flex-1" style={{ backgroundColor: preview.accent }} />
    </div>
  );
}

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const darkThemes = THEMES.filter((t) => t.mode === "dark");
  const lightThemes = THEMES.filter((t) => t.mode === "light");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
        <Palette className="h-4 w-4" />
        <span className="sr-only">Change theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-48">
        <DropdownMenuLabel>Dark</DropdownMenuLabel>
        {darkThemes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(theme === t.id && "bg-accent")}
          >
            <ThemeSwatch preview={t.preview} />
            <span className="flex-1">{t.name}</span>
            {theme === t.id && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Light</DropdownMenuLabel>
        {lightThemes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(theme === t.id && "bg-accent")}
          >
            <ThemeSwatch preview={t.preview} />
            <span className="flex-1">{t.name}</span>
            {theme === t.id && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
