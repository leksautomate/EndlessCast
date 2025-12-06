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
  colorTheme: "matrix",
  terminalFont: true,
  scanlines: false,
  glowEffects: true,
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [localTheme, setLocalTheme] = useState<ThemeColor>("matrix");

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
    document.documentElement.classList.add("dark");
    
    if (currentSettings.scanlines) {
      document.body.classList.add("scanlines");
    } else {
      document.body.classList.remove("scanlines");
    }
    
    setLocalTheme(theme);
  }, [settings]);

  const setTheme = (theme: ThemeColor) => {
    setLocalTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
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
