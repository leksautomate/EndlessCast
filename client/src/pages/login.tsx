import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Terminal, 
  Lock, 
  User, 
  ArrowLeft, 
  Wifi,
  Shield,
  Eye,
  EyeOff
} from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

function TerminalLoader() {
  const [dots, setDots] = useState("");
  
  useEffect(() => {
    const timer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return <span>{dots}</span>;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const { toast } = useToast();

  const addTerminalLine = (line: string) => {
    setTerminalLines((prev) => [...prev.slice(-4), line]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      addTerminalLine("[ERROR] Missing credentials");
      toast({
        title: "Authentication Failed",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    addTerminalLine("[INFO] Initiating authentication...");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        addTerminalLine("[ERROR] " + (data.message || "Authentication failed"));
        throw new Error(data.message || "Authentication failed");
      }

      addTerminalLine("[OK] Credentials verified");
      addTerminalLine("[OK] Session established");
      
      localStorage.setItem("sessionId", data.sessionId);
      
      setTimeout(() => {
        addTerminalLine("[OK] Access granted - Loading dashboard...");
        onLogin();
      }, 500);

    } catch (error: any) {
      toast({
        title: "Access Denied",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--theme-primary-hex)_0%,_transparent_50%)] opacity-5" />
      
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 left-10 text-primary/10 text-xs font-mono">
          SYS.INIT.LOGIN_MODULE
        </div>
        <div className="absolute bottom-10 right-10 text-primary/10 text-xs font-mono">
          SECURE_TERMINAL_v1.0
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </Link>

        <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded border-2 border-primary/50 flex items-center justify-center bg-primary/10 box-glow">
                <Wifi className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-primary glow-sm" data-testid="text-login-title">
                EndlessCast
              </h1>
              <p className="text-sm text-muted-foreground font-mono">
                <span className="text-primary">&gt;</span> Secure Terminal Access
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-black/50 rounded border border-primary/20 p-3 font-mono text-xs space-y-1">
              <div className="text-primary">$ auth --connect</div>
              {terminalLines.map((line, i) => (
                <div key={i} className={line.includes("ERROR") ? "text-red-500" : "text-muted-foreground"}>
                  {line}
                </div>
              ))}
              {isLoading && (
                <div className="text-muted-foreground">
                  [PROCESSING] Authenticating<TerminalLoader />
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="text-primary">$</span>
                <span className="w-2 h-3 bg-primary animate-pulse" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="bg-background/50 border-primary/30 focus:border-primary pl-10"
                    disabled={isLoading}
                    data-testid="input-username"
                  />
                  <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-muted-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="bg-background/50 border-primary/30 focus:border-primary pl-10 pr-10"
                    disabled={isLoading}
                    data-testid="input-password"
                  />
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full box-glow"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <span className="animate-pulse">Authenticating</span>
                    <TerminalLoader />
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Initialize Session
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-xs text-muted-foreground space-y-1">
              <p className="flex items-center justify-center gap-2">
                <Shield className="w-3 h-3 text-primary" />
                Encrypted Connection Active
              </p>
              <p className="font-mono text-primary/50">
                Default: admin / admin123
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 font-mono">
          <span className="text-primary">&gt;</span> EndlessCast Streaming Platform v1.0
        </p>
      </div>
    </div>
  );
}
