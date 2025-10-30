import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import Dashboard from "@/pages/Dashboard";
import Forecast from "@/pages/Forecast";
import Pricing from "@/pages/Pricing";
import Competitors from "@/pages/Competitors";
import Promo from "@/pages/Promo";
import Scenarios from "@/pages/Scenarios";
import Rules from "@/pages/Rules";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/forecast" component={Forecast} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/competitors" component={Competitors} />
      <Route path="/promo" component={Promo} />
      <Route path="/scenarios" component={Scenarios} />
      <Route path="/rules" component={Rules} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full bg-background text-foreground">
              <AppSidebar />
              <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-14 items-center justify-between border-b p-4 lg:h-[60px]">
                  <SidebarTrigger />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto p-6">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;