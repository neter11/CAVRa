import { LayoutDashboard, Building2, ClipboardList } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Propriedades", url: "/properties", icon: Building2 },
  { title: "Tarefas", url: "/tasks", icon: ClipboardList },
];

export function BottomMobileNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white dark:bg-slate-950 border-t border-border/40 z-40 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-all active:bg-muted gap-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid={`link-bottom-${item.url === "/" ? "dashboard" : item.url.slice(1)}`}
            >
              <Icon className={cn(
                "h-6 w-6 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-[10px] sm:text-xs font-medium text-center leading-tight transition-colors",
                isActive ? "text-primary font-semibold" : "text-muted-foreground"
              )}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
