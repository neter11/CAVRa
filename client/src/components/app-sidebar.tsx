import { Building2, LayoutDashboard, ClipboardList, AlertCircle, CheckCircle2, Home, TrendingUp } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useProperties } from "@/hooks/use-properties";
import { useTasks } from "@/hooks/use-tasks";

const overviewItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
];

const managementItems = [
  { title: "Propriedades", url: "/properties", icon: Building2 },
  { title: "Tarefas", url: "/tasks", icon: ClipboardList },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { data: properties = [] } = useProperties();
  const { data: tasks = [] } = useTasks();
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentDay = new Date().getDate();

  const { data: rentPayments = [] } = useQuery({
    queryKey: ["/api/rent-payments/summary", { month: currentMonth, year: currentYear }],
    queryFn: async () => {
      const res = await fetch(`/api/rent-payments/summary?month=${currentMonth}&year=${currentYear}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 0,
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: allExpenses = [] } = useQuery({
    queryKey: ["/api/all-expenses"],
    queryFn: async () => {
      const results = await Promise.all(
        properties.map(async (p) => {
          const res = await fetch(`/api/properties/${p.id}/expenses`);
          if (!res.ok) return [];
          return res.json();
        })
      );
      return results.flat();
    },
    enabled: properties.length > 0,
    staleTime: 0,
  });

  // Calculate summary statistics
  const isPropertyInMaintenance = (propertyId: number) => {
    const hasActiveTasks = (tasks || []).some(t => t.propertyId === propertyId && t.status === "pending");
    const hasRecentExpenses = (allExpenses || []).some(e => {
      if (e.propertyId !== propertyId || !e.date) return false;
      return new Date(e.date) >= thirtyDaysAgo;
    });
    return hasActiveTasks || hasRecentExpenses;
  };

  const totalProperties = properties.length;
  const propertiesInMaintenance = properties.filter(p => isPropertyInMaintenance(p.id)).length;
  
  const rentedProperties = properties.filter(p => p.status === "rented");
  const paidPropertiesIds = new Set((rentPayments || []).map((rp: any) => rp.propertyId));
  const paidRents = paidPropertiesIds.size;
  
  const lateProperties = rentedProperties.filter(p => {
    const isUnpaid = !paidPropertiesIds.has(p.id);
    const isPastDue = currentDay > p.rentDueDay;
    return isUnpaid && isPastDue;
  }).length;

  const menuItems = [
    { items: overviewItems, label: "VISÃO GERAL" },
    { items: managementItems, label: "GESTÃO" },
  ];

  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40 px-6 py-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
              E
            </div>
            <div>
              <p className="font-display font-bold text-lg tracking-tight">EstateFlow</p>
              <p className="text-xs text-muted-foreground font-medium">Gestão de Imóveis</p>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col">
        <div className="flex-1">
          {menuItems.map((group) => (
            <SidebarGroup key={group.label} className="py-5 px-0">
              <SidebarGroupLabel className="px-6 text-xs uppercase tracking-widest font-semibold text-muted-foreground/60 mb-3">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {group.items.map((item) => {
                    const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive}
                          className={isActive ? "bg-blue-50 dark:bg-blue-950/40 text-primary border-l-2 border-primary" : "border-l-2 border-transparent hover:bg-muted/50"}
                        >
                          <Link href={item.url} className="flex items-center gap-3 px-4 py-3 transition-all">
                            <item.icon className={`h-5 w-5 ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`} />
                            <span className={`font-medium text-sm ${isActive ? "text-primary font-semibold" : ""}`}>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>

        <div className="border-t border-border/40 pt-5">
          <SidebarGroup className="px-0 py-0">
            <SidebarGroupLabel className="px-6 text-xs uppercase tracking-widest font-semibold text-muted-foreground/60 mb-4">
              Resumo
            </SidebarGroupLabel>
            <div className="px-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Imóveis</span>
                </div>
                <span className="font-bold text-sm">{totalProperties}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-950/40 transition-colors">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                  <span className="text-xs font-medium text-amber-900 dark:text-amber-300">Manutenção</span>
                </div>
                <span className="font-bold text-sm text-amber-900 dark:text-amber-300">{propertiesInMaintenance}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-900 dark:text-emerald-300">Pagos</span>
                </div>
                <span className="font-bold text-sm text-emerald-900 dark:text-emerald-300">{paidRents}</span>
              </div>

              {lateProperties > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-xs font-medium text-destructive">Atrasados</span>
                  </div>
                  <span className="font-bold text-sm text-destructive">{lateProperties}</span>
                </div>
              )}
            </div>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
