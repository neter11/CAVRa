import { useState } from "react";
import { Link } from "wouter";
import { useProperties } from "@/hooks/use-properties";
import { PropertyForm } from "@/components/PropertyForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Building, Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";

export default function Properties() {
  const { data: properties, isLoading } = useProperties();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentDay = new Date().getDate();

  const { data: rentPaymentsMonth } = useQuery({
    queryKey: ["/api/rent-payments/summary", { month: currentMonth, year: currentYear }],
    queryFn: async () => {
      const res = await fetch(`/api/rent-payments/summary?month=${currentMonth}&year=${currentYear}`);
      if (!res.ok) return [];
      return res.json() as Promise<any[]>;
    }
  });

  const paidPropertiesIds = new Set((rentPaymentsMonth || []).map(rp => rp.propertyId));

  const filteredProps = properties?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.location.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'rented': return 'Alugado';
      case 'maintenance': return 'Manutenção';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'apartment': return 'Apartamento';
      case 'house': return 'Casa';
      case 'countryside': return 'Chácara/Sítio';
      case 'commercial': return 'Comercial';
      default: return type;
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Propriedades</h1>
          <p className="text-muted-foreground mt-1">Gerencie e acompanhe seus ativos imobiliários.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform">
              <Plus className="h-4 w-4" /> Adicionar Propriedade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Nova Propriedade</DialogTitle>
            </DialogHeader>
            <PropertyForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Pesquisar propriedades..." 
          className="pl-10 bg-card border-muted-foreground/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-80 bg-muted rounded-2xl"></div>)}
        </div>
      ) : filteredProps?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-2xl bg-muted/30">
          <Building className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-bold font-display">Nenhuma propriedade encontrada</h3>
          <p className="text-muted-foreground max-w-sm mt-2">Comece adicionando sua primeira propriedade para gerenciar aluguéis, despesas e notas.</p>
          <Button variant="outline" className="mt-6" onClick={() => setIsAddOpen(true)}>
            Adicionar Propriedade
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProps?.map((property) => (
            <Link key={property.id} href={`/properties/${property.id}`} className="group block">
              <div className="bg-card rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 h-full flex flex-col group-hover:-translate-y-1">
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  {property.imageUrl ? (
                    <img src={property.imageUrl} alt={property.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop" alt="Placeholder" className="object-cover w-full h-full opacity-80 group-hover:scale-105 transition-transform duration-500" />
                  )}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Badge variant={property.status === 'available' ? 'default' : property.status === 'rented' ? 'secondary' : 'destructive'} className="shadow-md backdrop-blur-md bg-background/90 text-foreground w-fit">
                      {getStatusLabel(property.status)}
                    </Badge>
                    {property.status === 'rented' && currentDay > property.rentDueDay && !paidPropertiesIds.has(property.id) && (
                      <Badge variant="destructive" className="shadow-md animate-pulse gap-1 w-fit">
                        <AlertCircle className="h-3 w-3" /> Atrasado
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-display font-bold text-xl line-clamp-1">{property.name}</h3>
                  <div className="flex items-center gap-1.5 text-muted-foreground mt-1.5 mb-4 text-sm">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="line-clamp-1">{property.location}</span>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t flex justify-between items-center">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aluguel</p>
                      <p className="font-bold text-lg text-primary">{formatCurrency(property.rentAmount)}/mês</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</p>
                      <p className="font-medium text-sm capitalize">{getTypeLabel(property.type)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
