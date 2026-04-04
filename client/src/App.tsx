import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import Account from "@/pages/account";
import Admin from "@/pages/admin";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function AppContent() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;
    const raw = sessionStorage.getItem('chaesa_upgrade_intent');
    if (!raw) return;
    try {
      const intent = JSON.parse(raw) as { plan: string; ts: number };
      const validPlans = ['pro', 'premium', 'advance', 'enterprise'];
      if (Date.now() - intent.ts < 60 * 60 * 1000 && validPlans.includes(intent.plan)) {
        sessionStorage.removeItem('chaesa_upgrade_intent');
        setLocation(`/account?upgrade=${intent.plan}`);
      } else {
        sessionStorage.removeItem('chaesa_upgrade_intent');
      }
    } catch {
      sessionStorage.removeItem('chaesa_upgrade_intent');
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  if (user && !user.registrationCompleted) {
    return <Register />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/account" component={Account} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
