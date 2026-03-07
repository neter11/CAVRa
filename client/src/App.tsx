import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "./pages/dashboard";
import Properties from "./pages/properties";
import PropertyDetails from "./pages/property-details";
import Tasks from "./pages/tasks";
import { AppSidebar } from "./components/app-sidebar";
import { MobileNav } from "./components/mobile-nav";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard}/>
      <Route path="/properties" component={Properties}/>
      <Route path="/properties/:id" component={PropertyDetails}/>
      <Route path="/tasks" component={Tasks}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex min-h-screen w-full bg-background/50">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
              <AppSidebar />
            </div>
            
            <div className="flex flex-col flex-1 w-full h-screen overflow-y-auto">
              {/* Mobile Header */}
              <div className="md:hidden border-b border-border/40 px-4 py-3 flex items-center justify-between bg-white dark:bg-slate-950">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20">
                    E
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm tracking-tight">EstateFlow</p>
                  </div>
                </div>
                <MobileNav />
              </div>

              <main className="flex-1">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
