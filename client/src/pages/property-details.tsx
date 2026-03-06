import { useState } from "react";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, DollarSign, Building, Percent, FileText, CheckCircle2, History } from "lucide-react";
import { useProperty, useDeleteProperty } from "@/hooks/use-properties";
import { useNotes, useCreateNote, useDeleteNote } from "@/hooks/use-notes";
import { useExpenses, useCreateExpense, useDeleteExpense } from "@/hooks/use-expenses";
import { PropertyForm } from "@/components/PropertyForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function PropertyDetails() {
  const { id } = useParams();
  const propertyId = parseInt(id || "0", 10);
  const { toast } = useToast();
  
  const { data: property, isLoading } = useProperty(propertyId);
  const deleteMutation = useDeleteProperty();
  
  const { data: notes } = useNotes(propertyId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  
  const { data: expenses } = useExpenses(propertyId);
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newExpenseDesc, setNewExpenseDesc] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");

  if (isLoading) {
    return <div className="p-10 animate-pulse"><div className="h-8 bg-muted w-1/4 rounded mb-8"></div><div className="h-64 bg-muted rounded-2xl"></div></div>;
  }

  if (!property) {
    return <div className="p-10 text-center"><h2 className="text-2xl font-bold">Propriedade não encontrada</h2><Link href="/properties" className="text-primary mt-4 inline-block hover:underline">Voltar para propriedades</Link></div>;
  }

  const netIncome = property.rentAmount - (property.isAgencyManaged ? (property.agencyFee || 0) : 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await createNote.mutateAsync({ propertyId, data: { content: newNote } });
      setNewNote("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao adicionar nota.",
        variant: "destructive",
      });
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseDesc || !newExpenseAmount) return;
    try {
      await createExpense.mutateAsync({ propertyId, data: { description: newExpenseDesc, amount: Number(newExpenseAmount) } });
      setNewExpenseDesc("");
      setNewExpenseAmount("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao adicionar despesa.",
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'DISPONÍVEL';
      case 'rented': return 'ALUGADO';
      case 'maintenance': return 'MANUTENÇÃO';
      default: return status.toUpperCase();
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
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/properties" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Propriedades
        </Link>
        <div className="flex gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2"><Edit className="h-4 w-4" /> Editar</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader><DialogTitle>Editar Propriedade</DialogTitle></DialogHeader>
              <PropertyForm initialData={property} onSuccess={() => setIsEditOpen(false)} />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2"><Trash2 className="h-4 w-4" /> Excluir</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente a propriedade e todos os seus dados associados.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  deleteMutation.mutate(propertyId, {
                    onSuccess: () => window.location.href = "/properties"
                  });
                }}>Excluir Propriedade</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
        <div className="h-48 md:h-64 w-full relative bg-muted">
          {property.imageUrl ? (
             <img src={property.imageUrl} alt={property.name} className="w-full h-full object-cover" />
          ) : (
            <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1280&h=720&fit=crop" alt="Placeholder" className="w-full h-full object-cover opacity-80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white flex justify-between items-end">
            <div>
              <Badge variant="secondary" className="mb-3 bg-white/20 backdrop-blur-md text-white border-white/10 hover:bg-white/30">{getStatusLabel(property.status)}</Badge>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white">{property.name}</h1>
              <div className="flex items-center mt-2 text-white/80">
                <MapPin className="h-4 w-4 mr-1.5" /> {property.location}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-x md:divide-y-0 divide-y border-b">
          <div className="p-4 md:p-6 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Aluguel Mensal</p>
            <p className="text-2xl font-bold font-display text-primary">{formatCurrency(property.rentAmount)}</p>
          </div>
          <div className="p-4 md:p-6 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Renda Líquida</p>
            <p className="text-2xl font-bold font-display text-emerald-600">{formatCurrency(netIncome)}</p>
          </div>
          <div className="p-4 md:p-6 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Tipo</p>
            <p className="text-lg font-bold capitalize flex items-center gap-2"><Building className="h-5 w-5 text-muted-foreground" /> {getTypeLabel(property.type)}</p>
          </div>
          <div className="p-4 md:p-6 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Imobiliária</p>
            <p className="text-lg font-bold flex items-center gap-2">
              {property.isAgencyManaged ? <><CheckCircle2 className="h-5 w-5 text-primary" /> Gerenciado</> : "Autogerido"}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:shadow-sm">Visão Geral</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:shadow-sm">Histórico</TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg data-[state=active]:shadow-sm">Notas</TabsTrigger>
          <TabsTrigger value="expenses" className="rounded-lg data-[state=active]:shadow-sm">Despesas</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 bg-card border rounded-2xl p-6 min-h-[400px]">
          <TabsContent value="overview" className="mt-0 space-y-6">
            <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-4"><FileText className="h-5 w-5 text-primary" /> Detalhes do Contrato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Início do Contrato</p>
                  <p className="font-semibold text-lg flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {property.contractStart ? format(new Date(property.contractStart), "dd/MM/yyyy", { locale: ptBR }) : "Não definido"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fim do Contrato</p>
                  <p className="font-semibold text-lg flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {property.contractEnd ? format(new Date(property.contractEnd), "dd/MM/yyyy", { locale: ptBR }) : "Não definido"}
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 p-5 rounded-xl border border-muted">
                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wider">Detalhamento Financeiro</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Aluguel Bruto:</span> <span className="font-semibold">{formatCurrency(property.rentAmount)}</span></div>
                  {property.isAgencyManaged && (
                    <div className="flex justify-between text-destructive"><span>Taxa Imobiliária:</span> <span>-{formatCurrency(property.agencyFee || 0)}</span></div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-bold text-base mt-2">
                    <span>Renda Líquida:</span> <span className="text-emerald-600">{formatCurrency(netIncome)}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
             <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-4 mb-6"><History className="h-5 w-5 text-primary" /> Histórico de Pagamentos (Simulação)</h3>
             <div className="space-y-4">
               {[1,2,3].map((i) => (
                 <div key={i} className="flex justify-between items-center p-4 border rounded-xl bg-card hover:bg-muted/50 transition-colors">
                   <div className="flex items-center gap-4">
                     <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><DollarSign className="h-5 w-5" /></div>
                     <div>
                       <p className="font-bold">Aluguel Recebido</p>
                       <p className="text-sm text-muted-foreground">{format(new Date(new Date().setMonth(new Date().getMonth() - i + 1)), "MMMM yyyy", { locale: ptBR })}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-lg text-emerald-600">+{formatCurrency(property.rentAmount)}</p>
                     <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 mt-1">Pago</Badge>
                   </div>
                 </div>
               ))}
             </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-4 mb-6"><FileText className="h-5 w-5 text-primary" /> Notas da Propriedade</h3>
            
            <form onSubmit={handleAddNote} className="mb-8 flex gap-3 items-start">
              <Textarea 
                placeholder="Adicione uma nota sobre manutenção, inquilinos, etc..." 
                className="resize-none flex-1 min-h-[80px]"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <Button type="submit" disabled={createNote.isPending || !newNote.trim()}>Adicionar Nota</Button>
            </form>

            <div className="space-y-4">
              {notes?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma nota ainda.</p>
              ) : (
                notes?.map(note => (
                  <div key={note.id} className="p-4 bg-muted/30 border rounded-xl group relative">
                    <p className="text-sm whitespace-pre-wrap pr-8">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-3 font-medium">
                      {note.createdAt ? format(new Date(note.createdAt), "dd/MM/yyyy • HH:mm", { locale: ptBR }) : "Recentemente"}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                      onClick={() => deleteNote.mutate({ id: note.id, propertyId })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="mt-0">
             <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-4 mb-6"><DollarSign className="h-5 w-5 text-primary" /> Manutenção & Despesas</h3>
             
             <form onSubmit={handleAddExpense} className="mb-8 p-5 bg-muted/30 border rounded-xl space-y-4">
               <h4 className="font-semibold text-sm">Registrar Nova Despesa</h4>
               <div className="flex flex-col sm:flex-row gap-4">
                 <Input 
                   placeholder="Descrição (ex: Reparo hidráulico)" 
                   className="flex-[2]"
                   value={newExpenseDesc}
                   onChange={(e) => setNewExpenseDesc(e.target.value)}
                 />
                 <Input 
                   type="number" 
                   placeholder="Valor (R$)" 
                   className="flex-1"
                   value={newExpenseAmount}
                   onChange={(e) => setNewExpenseAmount(e.target.value)}
                 />
                 <Button type="submit" disabled={createExpense.isPending || !newExpenseDesc || !newExpenseAmount}>Adicionar Despesa</Button>
               </div>
             </form>

             <div className="space-y-3">
              {expenses?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma despesa registrada.</p>
              ) : (
                expenses?.map(expense => (
                  <div key={expense.id} className="flex justify-between items-center p-4 border rounded-xl">
                    <div>
                      <p className="font-semibold">{expense.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {expense.date ? format(new Date(expense.date), "dd/MM/yyyy", { locale: ptBR }) : "Recentemente"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-destructive">-{formatCurrency(expense.amount)}</p>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-muted-foreground hover:text-destructive h-8 w-8"
                        onClick={() => deleteExpense.mutate({ id: expense.id, propertyId })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
