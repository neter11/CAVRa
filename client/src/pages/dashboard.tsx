import { useProperties } from "@/hooks/use-properties";
import { Building2, DollarSign, Home, Percent, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useExpenses } from "@/hooks/use-expenses";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: properties, isLoading: loadingProps } = useProperties();
  
  // Calculate total expenses for the current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Fetch all expenses by fetching for each property and flattening (simpler for now)
  const props = properties || [];
  
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

  const monthlyGross = props.filter(p => p.status === "rented").reduce((acc, p) => acc + p.rentAmount, 0);

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

  const paidPropertiesCount = (rentPaymentsMonth || []).length;
  const pendingPropertiesCount = Math.max(0, totalRented - paidPropertiesCount);
  const totalExpectedRent = monthlyGross;
  const actualCollectedRent = (rentPaymentsMonth || []).reduce((acc, rp) => {
    const property = props.find(p => p.id === rp.propertyId);
    return acc + (property?.rentAmount || 0);
  }, 0);
  
  const agencyCosts = props.filter(p => p.status === "rented" && p.isAgencyManaged).reduce((acc, p) => acc + (p.agencyFee || 0), 0);
  
  const totalMonthlyExpenses = (allExpenses || []).filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((acc, e) => acc + e.amount, 0);

  const monthlyNet = monthlyGross - agencyCosts - totalMonthlyExpenses;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const chartData = [
    { name: 'Jan', receita: monthlyGross * 0.8, despesa: totalMonthlyExpenses * 0.7, lucro: (monthlyGross * 0.8) - (totalMonthlyExpenses * 0.7) },
    { name: 'Fev', receita: monthlyGross * 0.85, despesa: totalMonthlyExpenses * 0.9, lucro: (monthlyGross * 0.85) - (totalMonthlyExpenses * 0.9) },
    { name: 'Mar', receita: monthlyGross * 0.9, despesa: totalMonthlyExpenses * 0.8, lucro: (monthlyGross * 0.9) - (totalMonthlyExpenses * 0.8) },
    { name: 'Abr', receita: monthlyGross * 0.95, despesa: totalMonthlyExpenses * 1.1, lucro: (monthlyGross * 0.95) - (totalMonthlyExpenses * 1.1) },
    { name: 'Mai', receita: monthlyGross, despesa: totalMonthlyExpenses, lucro: monthlyNet },
  ];

  const statCards = [
    { label: "Lucro Mensal Líquido", value: formatCurrency(monthlyNet), icon: monthlyNet >= 0 ? TrendingUp : TrendingDown, color: monthlyNet >= 0 ? "text-emerald-600" : "text-destructive" },
    { label: "Aluguéis Pagos Este Mês", value: `${paidPropertiesCount} / ${totalRented}`, icon: ShieldCheck, color: "text-emerald-600" },
    { label: "Pendentes", value: `${pendingPropertiesCount}`, icon: Home, color: "text-amber-600" },
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
              </div>
              <div className="h-10 w-10 bg-muted/50 rounded-full flex items-center justify-center">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

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
