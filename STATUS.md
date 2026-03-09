# Theme System — STATUS

## Completed

### 12-Theme System (Full Implementation)

**Theme Infrastructure:**
- `apps/web/lib/themes.ts` — Theme metadata: 12 themes (6 dark, 6 light) with IDs, names, mode flags, and hex preview colors
- `apps/web/components/theme-provider.tsx` — Rewritten for named themes. Uses `data-theme` attribute + `dark` class. Persists to `localStorage` with key `bdo-theme`. Migrates old `theme` key automatically.
- `apps/web/components/theme-selector.tsx` — DropdownMenu-based theme picker with color swatch previews, organized by dark/light sections
- `apps/web/app/globals.css` — CSS variable blocks for all 10 custom themes (midnight/dawn use existing `:root`/`.dark`). All variables use oklch color space.

**Themes Available:**

| Theme | Mode | Hue | Description |
|-------|------|-----|-------------|
| Midnight | Dark | Neutral | Default dark, grey tones |
| Crimson | Dark | Red (25) | Warm red accents |
| Ocean | Dark | Blue (250) | Cool deep-sea blue |
| Forest | Dark | Green (150) | Emerald green tones |
| Violet | Dark | Purple (300) | Mystical purple |
| OLED Black | Dark | Neutral | Pure black, max contrast |
| Dawn | Light | Neutral | Default light, clean white |
| Rose | Light | Pink (350) | Soft pink accents |
| Amber | Light | Gold (75) | Warm amber/gold |
| Sage | Light | Green (155) | Soft sage green |
| Nord | Light | Blue (250) | Cool blue-grey |
| Sand | Light | Tan (60) | Warm earthy tones |

**UI Integration:**
- Theme selector added to app header (top-right palette icon)
- Old dark/light toggle removed from sidebar footer
- Settings page has full theme grid with swatch previews
- Flash prevention script in root layout updated for named themes with old → new migration

**Files Changed:**
- `apps/web/lib/themes.ts` (NEW)
- `apps/web/components/theme-selector.tsx` (NEW)
- `apps/web/components/theme-provider.tsx` (rewritten)
- `apps/web/app/globals.css` (10 theme blocks added)
- `apps/web/components/layout/app-sidebar.tsx` (removed toggle, cleaned imports)
- `apps/web/app/(app)/layout.tsx` (added ThemeSelector to header)
- `apps/web/app/layout.tsx` (updated flash prevention script)
- `apps/web/app/(app)/settings/settings-content.tsx` (new theme picker grid)

**Verification:**
- TypeScript: clean (0 errors)
- Build: passes
- Tests: 19/19 pass
- All existing pages/components work with themes (they consume CSS variables, no hardcoded colors to fix)

## Accessibility Notes
- All themes maintain WCAG AA contrast ratios (foreground L=0.985 vs background L=0.145 for dark; foreground L=0.18-0.22 vs background L=0.97-0.98 for light)
- Primary colors chosen for sufficient contrast as both text-on-background and background-with-white-text
- Theme selector is keyboard-accessible via DropdownMenu
- `sr-only` label on theme button for screen readers

## TODO — Future Refinements
- [ ] Add "System" option that follows OS prefers-color-scheme
- [ ] Add theme transition animation (smooth CSS transition on variable changes)
- [ ] Consider per-chart theme-aware color palettes for better data viz
- [ ] Add theme preview tooltip on hover
- [ ] Store theme preference in Supabase user_settings (currently localStorage only)
- [ ] Add keyboard shortcut for quick theme cycling (e.g., Ctrl+Shift+T)
