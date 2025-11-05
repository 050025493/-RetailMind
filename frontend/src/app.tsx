import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import Dashboard from "@/pages/Dashboard";
import Forecast from "@/pages/Forecast";
import Pricing from "@/pages/Pricing";
import Competitors from "@/pages/Competitors";
import Promo from "@/pages/Promo";
import Scenarios from "@/pages/Scenarios";
import Rules from "@/pages/Rules";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import NotFound from "@/pages/NotFound";
import Profile from "@/pages/Profile";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";


// 🔒 Protected Route Component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

// 🔐 Auth Route Component (redirects if already logged in)
function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const token = localStorage.getItem("token");

  if (token) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

// 🧭 Router setup
function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/login">
        <AuthRoute component={Login} />
      </Route>
      <Route path="/signup">
        <AuthRoute component={Signup} />
      </Route>

      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/forecast">
        <ProtectedRoute component={Forecast} />
      </Route>
      <Route path="/pricing">
        <ProtectedRoute component={Pricing} />
      </Route>
      <Route path="/competitors">
        <ProtectedRoute component={Competitors} />
      </Route>
      <Route path="/promo">
        <ProtectedRoute component={Promo} />
      </Route>
      <Route path="/scenarios">
        <ProtectedRoute component={Scenarios} />
      </Route>
      <Route path="/rules">
        <ProtectedRoute component={Rules} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

// 🧱 Layout with Sidebar + Header
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3rem",
        } as React.CSSProperties
      }
    >
      <div className="flex h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center justify-between border-b p-4 lg:h-[60px]">
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// 🚀 Main App Component
export default function App() {
  const auth = useContext(AuthContext);

  if (!auth) return null;
  const { loading, token } = auth;

  // ⏳ Wait until we know if user is logged in
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-medium">
        Loading...
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          {token ? (
            // ✅ Authenticated: show sidebar layout
            <MainLayout>
              <Router />
            </MainLayout>
          ) : (
            // 🚪 Not logged in: show login/signup routes
            <Router />
          )}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
