import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ThemeSettings, ThemeColor } from "@shared/schema";
import { themePresets } from "@shared/schema";

interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
  settings: ThemeSettings | null;
  updateSettings: (settings: Partial<ThemeSettings>) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultSettings: ThemeSettings = {
  colorTheme: "ocean",
  terminalFont: true,
  scanlines: false,
  glowEffects: true,
};

function applyThemeVariables(theme: ThemeColor) {
  const preset = themePresets[theme];
  if (!preset) return;

  const root = document.documentElement;
  root.style.setProperty("--background", preset.bgHsl);
  root.style.setProperty("--foreground", "210 20% 92%");
  root.style.setProperty("--border", preset.borderHsl);

  root.style.setProperty("--card", preset.cardHsl);
  root.style.setProperty("--card-foreground", "210 20% 92%");
  root.style.setProperty("--card-border", preset.borderHsl);

  root.style.setProperty("--sidebar", preset.sidebarHsl);
  root.style.setProperty("--sidebar-foreground", "210 20% 80%");
  root.style.setProperty("--sidebar-border", preset.borderHsl);
  root.style.setProperty("--sidebar-primary", preset.primaryHsl);
  root.style.setProperty("--sidebar-primary-foreground", "0 0% 100%");
  root.style.setProperty("--sidebar-accent", preset.accentHsl);
  root.style.setProperty("--sidebar-accent-foreground", preset.primaryHsl);
  root.style.setProperty("--sidebar-ring", preset.primaryHsl);

  root.style.setProperty("--popover", preset.cardHsl);
  root.style.setProperty("--popover-foreground", "210 20% 92%");
  root.style.setProperty("--popover-border", preset.borderHsl);

  root.style.setProperty("--primary", preset.primaryHsl);
  root.style.setProperty("--primary-foreground", "0 0% 100%");

  root.style.setProperty("--secondary", preset.accentHsl);
  root.style.setProperty("--secondary-foreground", "210 20% 80%");

  root.style.setProperty("--muted", preset.mutedHsl);
  root.style.setProperty("--muted-foreground", "215 15% 50%");

  root.style.setProperty("--accent", preset.accentHsl);
  root.style.setProperty("--accent-foreground", preset.primaryHsl);

  root.style.setProperty("--input", preset.inputHsl);
  root.style.setProperty("--ring", preset.primaryHsl);

  root.style.setProperty("--chart-1", preset.primaryHsl);

  const hue = preset.primaryHsl.split(" ")[0];
  root.style.setProperty("--button-outline", `hsla(${hue}, 60%, 60%, 0.15)`);
  root.style.setProperty("--badge-outline", `hsla(${hue}, 60%, 60%, 0.1)`);
  root.style.setProperty("--elevate-1", `hsla(${hue}, 60%, 60%, 0.05)`);
  root.style.setProperty("--elevate-2", `hsla(${hue}, 60%, 60%, 0.1)`);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [localTheme, setLocalTheme] = useState<ThemeColor>("ocean");

  const { data: settings, isLoading } = useQuery<ThemeSettings>({
    queryKey: ["/api/theme-settings"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/theme-settings");
        if (!res.ok) return defaultSettings;
        return res.json();
      } catch {
        return defaultSettings;
      }
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<ThemeSettings>) => {
      const res = await apiRequest("POST", "/api/theme-settings", {
        ...settings,
        ...newSettings,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/theme-settings"] });
    },
  });

  useEffect(() => {
    const currentSettings = settings || defaultSettings;
    const theme = currentSettings.colorTheme;

    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-terminal-font", currentSettings.terminalFont ? "true" : "false");
    document.documentElement.setAttribute("data-glow", currentSettings.glowEffects ? "true" : "false");
    document.documentElement.setAttribute("data-scanlines", currentSettings.scanlines ? "true" : "false");
    document.documentElement.classList.add("dark");

    applyThemeVariables(theme);
    setLocalTheme(theme);
  }, [settings]);

  const setTheme = (theme: ThemeColor) => {
    setLocalTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
    applyThemeVariables(theme);
    updateSettingsMutation.mutate({ colorTheme: theme });
  };

  const updateSettings = (newSettings: Partial<ThemeSettings>) => {
    updateSettingsMutation.mutate(newSettings);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: localTheme,
        setTheme,
        settings: settings || defaultSettings,
        updateSettings,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export { themePresets };
