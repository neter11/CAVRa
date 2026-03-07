import { useState } from "react";
import { Menu, X, Building2, LayoutDashboard, ClipboardList } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Propriedades", url: "/properties", icon: Building2 },
  { title: "Tarefas", url: "/tasks", icon: ClipboardList },
];

export function MobileNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          data-testid="button-mobile-menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b border-border/40 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
              E
            </div>
            <div>
              <p className="font-display font-bold text-lg tracking-tight">EstateFlow</p>
              <p className="text-xs text-muted-foreground font-medium">Gestão de Imóveis</p>
            </div>
          </div>
        </SheetHeader>

        <nav className="flex flex-col space-y-1 p-4">
          {menuItems.map((item) => {
            const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
            return (
              <Link
                key={item.title}
                href={item.url}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/40 text-primary border-l-2 border-primary"
                    : "border-l-2 border-transparent hover:bg-muted/50"
                }`}
                data-testid={`link-${item.url === "/" ? "dashboard" : item.url.slice(1)}`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`font-medium text-sm ${isActive ? "text-primary font-semibold" : ""}`}>
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
