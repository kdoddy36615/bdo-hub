"use client";

import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { THEMES } from "@/lib/themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";

function ThemeSwatch({ preview }: { preview: { bg: string; card: string; primary: string; accent: string } }) {
  return (
    <div className="flex h-6 w-full overflow-hidden rounded border border-foreground/10">
      <div className="flex-1" style={{ backgroundColor: preview.bg }} />
      <div className="flex-1" style={{ backgroundColor: preview.card }} />
      <div className="flex-1" style={{ backgroundColor: preview.primary }} />
      <div className="flex-1" style={{ backgroundColor: preview.accent }} />
    </div>
  );
}

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const darkThemes = THEMES.filter((t) => t.mode === "dark");
  const lightThemes = THEMES.filter((t) => t.mode === "light");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Palette className="h-4 w-4" />
        <span className="sr-only">Change theme</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose Theme</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Dark</Label>
            <div className="grid grid-cols-3 gap-2">
              {darkThemes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setOpen(false); }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-xs transition-colors hover:bg-accent",
                    theme === t.id && "border-primary ring-2 ring-primary"
                  )}
                >
                  <ThemeSwatch preview={t.preview} />
                  <div className="flex items-center gap-1">
                    {theme === t.id && <Check className="h-3 w-3 text-primary" />}
                    <span>{t.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Light</Label>
            <div className="grid grid-cols-3 gap-2">
              {lightThemes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setOpen(false); }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-xs transition-colors hover:bg-accent",
                    theme === t.id && "border-primary ring-2 ring-primary"
                  )}
                >
                  <ThemeSwatch preview={t.preview} />
                  <div className="flex items-center gap-1">
                    {theme === t.id && <Check className="h-3 w-3 text-primary" />}
                    <span>{t.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
