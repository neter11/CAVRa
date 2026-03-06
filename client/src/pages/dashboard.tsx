import { useProperties } from "@/hooks/use-properties";
import { Building2, DollarSign, Home, Percent, ShieldCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { data: properties, isLoading } = useProperties();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const props = properties || [];
  
  const totalRented = props.filter(p => p.status === "rented").length;
  const totalAvailable = props.filter(p => p.status === "available").length;
  
  const monthlyGross = props.filter(p => p.status === "rented").reduce((acc, p) => acc + p.rentAmount, 0);
  const agencyCosts = props.filter(p => p.status === "rented" && p.isAgencyManaged).reduce((acc, p) => acc + (p.agencyFee || 0), 0);
  const monthlyNet = monthlyGross - agencyCosts;

  // Mock data for chart combined with real current month
  const chartData = [
    { name: 'Jul', gross: monthlyGross * 0.8, net: monthlyNet * 0.8 },
    { name: 'Aug', gross: monthlyGross * 0.85, net: monthlyNet * 0.85 },
    { name: 'Sep', gross: monthlyGross * 0.9, net: monthlyNet * 0.9 },
    { name: 'Oct', gross: monthlyGross * 0.95, net: monthlyNet * 0.95 },
    { name: 'Nov', gross: monthlyGross, net: monthlyNet },
  ];

  const statCards = [
    { label: "Net Monthly Income", value: `$${monthlyNet.toLocaleString()}`, icon: DollarSign, trend: "+5.2%" },
    { label: "Gross Monthly Income", value: `$${monthlyGross.toLocaleString()}`, icon: Percent, trend: "+4.1%" },
    { label: "Agency Costs", value: `$${agencyCosts.toLocaleString()}`, icon: ShieldCheck, trend: "0.0%" },
    { label: "Properties Rented", value: `${totalRented} / ${props.length}`, icon: Home, trend: "12% vacancy" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Here is your portfolio overview at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-card border shadow-sm hover:shadow-md transition-shadow rounded-2xl p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold font-display mt-2">{stat.value}</h3>
              </div>
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-muted-foreground flex items-center gap-1">
              <span className="text-emerald-500">{stat.trend}</span> vs last month
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border shadow-sm rounded-2xl p-6">
          <h3 className="text-lg font-bold font-display mb-6">Revenue Overview</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="gross" fill="#E2E8F0" radius={[4, 4, 0, 0]} name="Gross Income" />
                <Bar dataKey="net" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Net Income" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border shadow-sm rounded-2xl p-6">
          <h3 className="text-lg font-bold font-display mb-6">Portfolio Status</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground font-medium">Rented</span>
                <span className="font-bold">{totalRented}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(totalRented / Math.max(1, props.length)) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground font-medium">Available</span>
                <span className="font-bold">{totalAvailable}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${(totalAvailable / Math.max(1, props.length)) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground font-medium">Under Maintenance</span>
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
                <p className="text-sm font-medium text-muted-foreground">Total Value Managed</p>
                <p className="text-xl font-bold font-display">Est. $4.2M</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
