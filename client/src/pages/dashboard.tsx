import { useProperties } from "@/hooks/use-properties";
import { Building2, DollarSign, Home, Percent, ShieldCheck, TrendingDown, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useExpenses } from "@/hooks/use-expenses";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: properties, isLoading: loadingProps } = useProperties();
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentDay = new Date().getDate();

  const props = properties || [];
  
  const getRentForMonth = (property: any, month: number) => {
    if (!property.rentHistory || property.rentHistory.length === 0) return property.rentAmount;
    const history = property.rentHistory.map((h: string) => JSON.parse(h)).sort((a: any, b: any) => b.startMonth - a.startMonth);
    const record = history.find((h: any) => h.startMonth <= month);
    return record ? record.value : property.rentAmount;
  };

  const { data: allExpenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ["/api/all-expenses"],
    queryFn: async () => {
      const results = await Promise.all(
        props.map(async (p) => {
          const res = await fetch(`/api/properties/${p.id}/expenses`);
          if (!res.ok) return [];
          return res.json();
        })
      );
      return results.flat();
    },
    enabled: props.length > 0
  });

  const monthlyGross = props.filter(p => p.status === "rented").reduce((acc, p) => acc + getRentForMonth(p, currentMonth), 0);

  const { data: rentPaymentsMonth, isLoading: loadingRent } = useQuery({
    queryKey: ["/api/rent-payments/summary", { month: currentMonth, year: currentYear }],
    queryFn: async () => {
      const res = await fetch(`/api/rent-payments/summary?month=${currentMonth}&year=${currentYear}`);
      if (!res.ok) return [];
      return res.json() as Promise<any[]>;
    }
  });

  if (loadingProps || (props.length > 0 && loadingExpenses) || loadingRent) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const rentedProperties = props.filter(p => p.status === "rented");
  const totalRented = rentedProperties.length;
  const totalAvailable = props.filter(p => p.status === "available").length;

  const paidPropertiesIds = new Set((rentPaymentsMonth || []).map(rp => rp.propertyId));
  const lateProperties = rentedProperties.filter(p => {
    // A property is late if:
    // 1. Today's day is > rentDueDay
    // 2. There is no payment record for the current month and year
    const isUnpaid = !paidPropertiesIds.has(p.id);
    const isPastDue = currentDay > p.rentDueDay;
    return isUnpaid && isPastDue;
  }).map(p => ({
    ...p,
    daysOverdue: currentDay - p.rentDueDay
  }));

  const lateRentsCount = lateProperties.length;
  const totalLateAmount = lateProperties.reduce((acc, p) => acc + getRentForMonth(p, currentMonth), 0);

  const paidPropertiesCount = paidPropertiesIds.size;
  const pendingPropertiesCount = Math.max(0, totalRented - paidPropertiesCount);
  const totalExpectedRent = monthlyGross;
  const actualCollectedRent = (rentPaymentsMonth || []).reduce((acc, rp) => {
    const property = props.find(p => p.id === rp.propertyId);
    return acc + (property ? getRentForMonth(property, currentMonth) : 0);
  }, 0);
  
  const agencyCosts = props.filter(p => p.status === "rented" && p.isAgencyManaged).reduce((acc, p) => acc + (p.agencyFee || 0), 0);
  
  const totalMonthlyExpenses = (allExpenses || []).filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((acc, e) => acc + e.amount, 0);

  const monthlyNet = monthlyGross - agencyCosts - totalMonthlyExpenses;

  const propertyProfitData = props.map(p => {
    const propertyExpenses = (allExpenses || []).filter(e => e.propertyId === p.id);
    const totalExpenses = propertyExpenses.reduce((acc, e) => acc + e.amount, 0);
    const currentRent = getRentForMonth(p, currentMonth);
    const profit = currentRent - totalExpenses;
    return {
      name: p.name,
      profit: profit,
      id: p.id
    };
  }).sort((a, b) => b.profit - a.profit);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const chartData = months.slice(0, currentMonth + 1).map((name, i) => {
    const monthGross = props.filter(p => p.status === "rented").reduce((acc, p) => acc + getRentForMonth(p, i), 0);
    const monthExpenses = (allExpenses || []).filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === i && d.getFullYear() === currentYear;
    }).reduce((acc, e) => acc + e.amount, 0);
    const monthAgency = props.filter(p => p.status === "rented" && p.isAgencyManaged).reduce((acc, p) => acc + (p.agencyFee || 0), 0);
    
    return {
      name,
      receita: monthGross,
      despesa: monthExpenses + monthAgency,
      lucro: monthGross - monthExpenses - monthAgency
    };
  });

  const statCards = [
    { label: "Lucro Mensal Líquido", value: formatCurrency(monthlyNet), icon: monthlyNet >= 0 ? TrendingUp : TrendingDown, color: monthlyNet >= 0 ? "text-emerald-600" : "text-destructive" },
    { label: "Aluguéis Pagos Este Mês", value: `${paidPropertiesCount} / ${totalRented}`, icon: ShieldCheck, color: "text-emerald-600" },
    { label: "Aluguéis Atrasados", value: formatCurrency(totalLateAmount), subValue: `${lateRentsCount} ${lateRentsCount === 1 ? 'propriedade' : 'propriedades'}`, icon: AlertCircle, color: "text-destructive" },
    { label: "Propriedades Alugadas", value: `${totalRented} / ${props.length}`, icon: Home, color: "text-blue-600" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Painel de Controle</h1>
          <p className="text-muted-foreground mt-1">Visão geral do seu portfólio imobiliário.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-card border shadow-sm hover:shadow-md transition-shadow rounded-2xl p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className={`text-2xl font-bold font-display mt-2 ${stat.color}`}>{stat.value}</h3>
                {stat.subValue && <p className="text-xs text-muted-foreground mt-1">{stat.subValue}</p>}
              </div>
              <div className="h-10 w-10 bg-muted/50 rounded-full flex items-center justify-center">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {lateProperties.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl overflow-hidden">
          <div className="p-4 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-bold text-destructive">Propriedades com Pagamentos Atrasados</h3>
          </div>
          <div className="divide-y divide-destructive/10">
            {lateProperties.map(p => (
              <Link key={p.id} href={`/properties/${p.id}`} className="flex items-center justify-between p-4 hover:bg-destructive/10 transition-colors group">
                <div className="space-y-1">
                  <p className="font-bold group-hover:underline">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.location}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-destructive">{formatCurrency(p.rentAmount)}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
                    <Clock className="h-3 w-3" />
                    <span>{p.daysOverdue} {p.daysOverdue === 1 ? 'dia' : 'dias'} de atraso (Venceu dia {p.rentDueDay})</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border shadow-sm rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold font-display">Progresso de Recebimento ({new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date())})</h3>
              <span className="text-sm font-bold text-primary">{formatCurrency(actualCollectedRent)} / {formatCurrency(totalExpectedRent)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-4">
              <div 
                className="bg-primary h-4 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (actualCollectedRent / Math.max(1, totalExpectedRent)) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-card border shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold font-display mb-6">Receita vs Despesas</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#F3F4F6'}} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                  <Bar dataKey="receita" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Receita Bruta" />
                  <Bar dataKey="despesa" fill="#F43F5E" radius={[4, 4, 0, 0]} name="Despesas" />
                  <Bar dataKey="lucro" fill="#10B981" radius={[4, 4, 0, 0]} name="Lucro Líquido" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold font-display mb-6">Lucro por Propriedade</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={propertyProfitData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#F3F4F6'}} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} name="Lucro" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold font-display mb-6">Ranking de Imóveis Mais Lucrativos</h3>
            <div className="space-y-4">
              {propertyProfitData.map((item, index) => {
                let indicatorColor = "bg-emerald-500";
                if (index >= propertyProfitData.length * 0.66) {
                  indicatorColor = "bg-destructive";
                } else if (index >= propertyProfitData.length * 0.33) {
                  indicatorColor = "bg-amber-500";
                }
                
                return (
                  <Link key={item.id} href={`/properties/${item.id}`} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors group">
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-muted-foreground w-6">{index + 1}️⃣</span>
                      <div>
                        <p className="font-bold group-hover:underline">{item.name}</p>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full", indicatorColor)} />
                          <span className="text-xs text-muted-foreground">
                            {index < propertyProfitData.length * 0.33 ? "Alta Lucratividade" : 
                             index < propertyProfitData.length * 0.66 ? "Média Lucratividade" : "Baixa Lucratividade"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="font-bold text-emerald-600">{formatCurrency(item.profit)}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-card border shadow-sm rounded-2xl p-6">
          <h3 className="text-lg font-bold font-display mb-6">Status do Portfólio</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground font-medium">Alugadas</span>
                <span className="font-bold">{totalRented}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(totalRented / Math.max(1, props.length)) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground font-medium">Disponíveis</span>
                <span className="font-bold">{totalAvailable}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${(totalAvailable / Math.max(1, props.length)) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground font-medium">Em Manutenção</span>
                <span className="font-bold">{props.length - totalRented - totalAvailable}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${((props.length - totalRented - totalAvailable) / Math.max(1, props.length)) * 100}%` }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total Gerenciado</p>
                <p className="text-xl font-bold font-display">Est. R$ 4.2M</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
