import { useState, useEffect } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/app-layout";
import NotFound from "@/pages/not-found";
import Overview from "@/pages/overview";
import Videos from "@/pages/videos";
import Destinations from "@/pages/destinations";
import Logs from "@/pages/logs";
import SystemPage from "@/pages/system";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import { LoginPage } from "@/pages/login";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground font-mono">
          <span className="text-primary">&gt;</span> Verifying session...
        </p>
      </div>
    </div>
  );
}

function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const sessionId = localStorage.getItem("sessionId");

      if (!sessionId) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/check", {
          headers: { "x-session-id": sessionId },
        });
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  const login = () => setIsAuthenticated(true);
  const logout = () => {
    localStorage.removeItem("sessionId");
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
}

function AppRouter() {
  const { isAuthenticated, login, logout } = useAuth();

  if (isAuthenticated === null) {
    return <LoadingScreen />;
  }

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? <Redirect to="/app" /> : <Landing />}
      </Route>

      <Route path="/login">
        {isAuthenticated ? <Redirect to="/app" /> : <LoginPage onLogin={login} />}
      </Route>

      <Route path="/app">
        {isAuthenticated ? (
          <AppLayout onLogout={logout}>
            <Overview />
          </AppLayout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route path="/app/videos">
        {isAuthenticated ? (
          <AppLayout onLogout={logout}>
            <Videos />
          </AppLayout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route path="/app/destinations">
        {isAuthenticated ? (
          <AppLayout onLogout={logout}>
            <Destinations />
          </AppLayout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route path="/app/system">
        {isAuthenticated ? (
          <AppLayout onLogout={logout}>
            <SystemPage />
          </AppLayout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route path="/app/logs">
        {isAuthenticated ? (
          <AppLayout onLogout={logout}>
            <Logs />
          </AppLayout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route path="/app/settings">
        {isAuthenticated ? (
          <AppLayout onLogout={logout}>
            <Settings />
          </AppLayout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route path="/settings">
        {isAuthenticated ? <Redirect to="/app/settings" /> : <Redirect to="/login" />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
