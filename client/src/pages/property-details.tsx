import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, DollarSign, Building, FileText, History, Check, X, AlertCircle, Clock, Home, BarChart3, NotepadText } from "lucide-react";
import { useProperty, useDeleteProperty } from "@/hooks/use-properties";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useNotes, useCreateNote, useDeleteNote } from "@/hooks/use-notes";
import { useExpenses, useCreateExpense, useDeleteExpense } from "@/hooks/use-expenses";
import { PropertyForm } from "@/components/PropertyForm";
import { useTasks } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { usePropertyPhotos, useAddPropertyPhoto, useDeletePropertyPhoto, useSetCoverPhoto } from "@/hooks/use-photos";
import { useLocalPhotos } from "@/hooks/use-local-photos";
import { compressImage } from "@/lib/image-compression";
import { useTenant, useUpsertTenant } from "@/hooks/use-tenant";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlus, ImageIcon, Star, User, Phone, Mail, Briefcase, Info, Heart, Wallet, ShieldCheck, Plus } from "lucide-react";

export default function PropertyDetails() {
  const { id } = useParams();
  const propertyId = parseInt(id || "0", 10);
  const { toast } = useToast();
  
  const { data: property, isLoading } = useProperty(propertyId);
  const { data: tasks } = useTasks();
  const deleteMutation = useDeleteProperty();
  
  const { data: notes } = useNotes(propertyId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  
  const { data: expenses } = useExpenses(propertyId);
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const { data: dbPhotos, isLoading: isLoadingPhotos } = usePropertyPhotos(propertyId);
  const addPhotoMutation = useAddPropertyPhoto(propertyId);
  const deletePhotoMutation = useDeletePropertyPhoto(propertyId);
  const setCoverMutation = useSetCoverPhoto(propertyId);
  
  const { photos, isLoading: isLoadingLocal, addPhoto: addLocalPhoto, deletePhoto: deleteLocalPhoto, setCoverPhoto: setLocalCoverPhoto } = useLocalPhotos(propertyId);
  
  const photos_list = photos.length > 0 ? photos : dbPhotos;

  const { data: tenant, isLoading: isLoadingTenant } = useTenant(propertyId);
  const upsertTenantMutation = useUpsertTenant(propertyId);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTenantDialogOpen, setIsTenantDialogOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [isRentHistoryOpen, setIsRentHistoryOpen] = useState(false);
  const [newRentValue, setNewRentValue] = useState("");
  const currentMonth = new Date().getMonth();
  const [newRentMonth, setNewRentMonth] = useState(currentMonth.toString());
  const [newNote, setNewNote] = useState("");
  const [newExpenseDesc, setNewExpenseDesc] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateRentHistoryMutation = useMutation({
    mutationFn: async (history: string[]) => {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentHistory: history }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar histórico de aluguel");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}`] });
      toast({ title: "Sucesso", description: "Histórico de aluguel atualizado." });
      setIsRentHistoryOpen(false);
    }
  });

  const currentYear = new Date().getFullYear();
  const currentDay = new Date().getDate();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: payments } = useQuery({
    queryKey: [`/api/properties/${propertyId}/rent-payments`, { year: selectedYear }],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${propertyId}/rent-payments?year=${selectedYear}`);
      if (!res.ok) throw new Error("Falha ao carregar pagamentos");
      return res.json() as Promise<any[]>;
    },
    staleTime: 0,
  });

  const togglePaymentMutation = useMutation({
    mutationFn: async ({ month, year }: { month: number, year: number }) => {
      const res = await fetch(`/api/properties/${propertyId}/rent-payments/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar pagamento");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}/rent-payments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/rent-payments/summary"] });
      toast({ title: "Sucesso", description: "Status de pagamento atualizado." });
    }
  });

  if (isLoading) {
    return <div className="p-10 animate-pulse"><div className="h-8 bg-muted w-1/4 rounded mb-8"></div><div className="h-64 bg-muted rounded-2xl"></div></div>;
  }

  if (!property) {
    return <div className="p-10 text-center"><h2 className="text-2xl font-bold">Propriedade não encontrada</h2><Link href="/properties" className="text-primary mt-4 inline-block hover:underline">Voltar para propriedades</Link></div>;
  }

  const isCurrentMonthLate = property.status === "rented" && currentDay > property.rentDueDay && !payments?.some(p => p.month === currentMonth && p.year === currentYear);

  const getRentForMonth = (month: number) => {
    if (!property.rentHistory || property.rentHistory.length === 0) return property.rentAmount;
    const history = property.rentHistory.map((h: string) => JSON.parse(h)).sort((a: any, b: any) => b.startMonth - a.startMonth);
    const record = history.find((h: any) => h.startMonth <= month);
    return record ? record.value : property.rentAmount;
  };

  const currentRent = getRentForMonth(currentMonth);
  const netIncome = currentRent - (property.isAgencyManaged ? (property.agencyFee || 0) : 0);
  const totalExpensesAmount = (expenses || []).reduce((acc, e) => acc + e.amount, 0);
  const monthlyProfit = currentRent - totalExpensesAmount;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await createNote.mutateAsync({ propertyId, data: { content: newNote } });
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId] });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao adicionar nota.", variant: "destructive" });
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseDesc || !newExpenseAmount) return;
    try {
      await createExpense.mutateAsync({ propertyId, data: { description: newExpenseDesc, amount: Number(newExpenseAmount) } });
      setNewExpenseDesc("");
      setNewExpenseAmount("");
      // Force immediate dashboard/properties refresh
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-expenses"] });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao adicionar despesa.", variant: "destructive" });
    }
  };

  const handleAddRentHistory = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(newRentValue);
    const month = Number(newRentMonth);
    if (isNaN(value) || value <= 0) return;
    const currentHistory = (property.rentHistory || []).map((h: string) => JSON.parse(h));
    const newRecord = { value, startMonth: month };
    const existingIndex = currentHistory.findIndex((h: any) => h.startMonth === month);
    if (existingIndex > -1) { currentHistory[existingIndex] = newRecord; } else { currentHistory.push(newRecord); }
    updateRentHistoryMutation.mutate(currentHistory.map((h: any) => JSON.stringify(h)));
  };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const isMaintenance = (tasks || []).some(t => t.propertyId === propertyId && t.status === "pending") || 
                        (expenses || []).some(e => e.date && new Date(e.date) >= thirtyDaysAgo);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Erro", description: "Por favor, selecione uma imagem válida.", variant: "destructive" });
      return;
    }

    setIsCompressing(true);
    try {
      const compressedDataUrl = await compressImage(file);
      setPreviewImage(compressedDataUrl);
    } catch (error: any) {
      toast({ 
        title: "Erro", 
        description: error.message || "Não foi possível processar a imagem.", 
        variant: "destructive" 
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleConfirmPhoto = () => {
    if (previewImage) {
      try {
        addLocalPhoto(previewImage);
        toast({ title: "Sucesso", description: "Foto adicionada com sucesso!" });
        setPreviewImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error: any) {
        toast({ 
          title: "Erro", 
          description: error.message || "Não foi possível salvar a foto.", 
          variant: "destructive" 
        });
      }
    }
  };

  const getStatusLabel = (status: string) => {
    if (isMaintenance) return 'MANUTENÇÃO';
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
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link href="/properties" className="flex items-center text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors h-10">
          <ArrowLeft className="h-4 w-4 mr-2 flex-shrink-0" /> Voltar
        </Link>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={isRentHistoryOpen} onOpenChange={setIsRentHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm h-9 px-2 sm:px-3"><History className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="hidden sm:inline">Histórico</span></Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader><DialogTitle>Histórico de Valor do Aluguel</DialogTitle></DialogHeader>
              <div className="space-y-6 pt-4">
                <form onSubmit={handleAddRentHistory} className="space-y-4 p-4 border rounded-xl bg-muted/30">
                  <h4 className="font-semibold text-sm">Adicionar Novo Valor</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Novo Valor (R$)</label>
                      <Input type="number" value={newRentValue} onChange={(e) => setNewRentValue(e.target.value)} placeholder="2200" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Mês de Início</label>
                      <Select value={newRentMonth} onValueChange={setNewRentMonth}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
                            <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={updateRentHistoryMutation.isPending}>Salvar Alteração</Button>
                </form>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm px-1">Registros Anteriores</h4>
                  <div className="space-y-2">
                    {(property.rentHistory || [])
                      .map((h: string) => JSON.parse(h))
                      .sort((a: any, b: any) => a.startMonth - b.startMonth)
                      .map((record: any, idx: number, arr: any[]) => {
                        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                        const period = arr[idx + 1] ? `${monthNames[record.startMonth]} – ${monthNames[arr[idx + 1].startMonth]}` : `${monthNames[record.startMonth]} – Presente`;
                        return (
                          <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-card">
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{period}</p>
                              <p className="text-xs text-muted-foreground font-bold text-primary">{formatCurrency(record.value)}</p>
                            </div>
                            {idx > 0 && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                                const newHistory = (property.rentHistory || []).filter((_: any, i: number) => i !== idx);
                                updateRentHistoryMutation.mutate(newHistory);
                              }}><Trash2 className="h-4 w-4" /></Button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm h-9 px-2 sm:px-3"><Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="hidden sm:inline">Editar</span></Button></DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader className="sticky top-0 bg-background pt-4 pb-2 -mx-6 px-6"><DialogTitle>Editar Propriedade</DialogTitle></DialogHeader>
              <div className="overflow-y-auto px-0 py-4"><PropertyForm initialData={property} onSuccess={() => setIsEditOpen(false)} /></div>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive" size="sm" className="gap-1.5 text-xs sm:text-sm h-9 px-2 sm:px-3"><Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="hidden sm:inline">Excluir</span></Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate(propertyId, { onSuccess: () => window.location.href = "/properties" })}>Excluir Propriedade</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="bg-card rounded-2xl sm:rounded-3xl border shadow-sm overflow-hidden">
        <div className="h-40 sm:h-48 md:h-64 w-full relative bg-muted">
          {property.imageUrl ? <img src={property.imageUrl} alt={property.name} className="w-full h-full object-cover" /> : <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1280&h=720&fit=crop" alt="Placeholder" className="w-full h-full object-cover opacity-80" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 right-3 sm:right-6 text-white flex flex-col gap-2 sm:gap-0 sm:flex-row sm:justify-between sm:items-end">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
                <Badge variant={isMaintenance ? "destructive" : "secondary"} className={cn("backdrop-blur-md border-white/10 text-xs sm:text-sm", isMaintenance ? "bg-destructive/80 text-white" : "bg-white/20 text-white")}>{getStatusLabel(property.status)}</Badge>
                {isCurrentMonthLate && (
                  <TooltipProvider><Tooltip><TooltipTrigger asChild><Badge variant="destructive" className="bg-destructive/80 text-white animate-pulse gap-0.5 sm:gap-1 text-xs sm:text-sm"><AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> <span className="hidden sm:inline">Pagamento Atrasado</span></Badge></TooltipTrigger><TooltipContent><p>Vencimento dia {property.rentDueDay}. Hoje é dia {currentDay}.</p></TooltipContent></Tooltip></TooltipProvider>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white line-clamp-2">{property.name}</h1>
              <div className="flex items-center mt-1 sm:mt-2 text-white/80 text-xs sm:text-sm"><MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" /> <span className="line-clamp-1">{property.location}</span></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 border-b">
          <div className="p-3 sm:p-4 md:p-6 flex flex-col justify-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Aluguel</p>
            <p className="text-lg sm:text-2xl font-bold font-display text-primary">{formatCurrency(property.rentAmount)}</p>
          </div>
          <div className="p-3 sm:p-4 md:p-6 flex flex-col justify-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Lucro</p>
            <p className={cn("text-lg sm:text-2xl font-bold font-display", monthlyProfit >= 0 ? "text-emerald-600" : "text-destructive")}>{formatCurrency(monthlyProfit)}</p>
          </div>
          <div className="p-3 sm:p-4 md:p-6 flex flex-col justify-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Vencimento</p>
            <p className="text-lg sm:text-2xl font-bold font-display text-amber-600">{property.rentDueDay}</p>
          </div>
          <div className="p-3 sm:p-4 md:p-6 flex flex-col justify-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1">Tipo</p>
            <p className="text-xs sm:text-lg font-bold capitalize flex items-center gap-1 sm:gap-2"><Building className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" /> <span className="truncate">{getTypeLabel(property.type)}</span></p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <div className="border-b bg-muted/30 rounded-t-2xl overflow-x-auto">
          <TabsList className="flex h-auto bg-transparent p-0 rounded-none space-x-0 w-full sm:w-auto">
            <TabsTrigger value="overview" className="rounded-none flex-1 sm:flex-initial border-r border-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-background py-3 sm:py-4 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Visão Geral</span><span className="inline sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-none flex-1 sm:flex-initial border-r border-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-background py-3 sm:py-4 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Histórico</span><span className="inline sm:hidden">Hist.</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-none flex-1 sm:flex-initial border-r border-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-background py-3 sm:py-4 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Despesas</span><span className="inline sm:hidden">Desp.</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-none flex-1 sm:flex-initial border-r border-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-background py-3 sm:py-4 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
              <NotepadText className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Notas</span><span className="inline sm:hidden">Not.</span>
            </TabsTrigger>
            <TabsTrigger value="tenant" className="rounded-none flex-1 sm:flex-initial border-r border-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-background py-3 sm:py-4 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Inquilino</span><span className="inline sm:hidden">Inq.</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="rounded-none flex-1 sm:flex-initial data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:bg-background py-3 sm:py-4 gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
              <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Fotos</span><span className="inline sm:hidden">Fot.</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="mt-0 bg-card border border-t-0 rounded-b-2xl p-4 sm:p-6 min-h-[300px]">
          <TabsContent value="overview" className="mt-0 space-y-6">
            <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-4"><FileText className="h-5 w-5 text-primary" /> Detalhes do Contrato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div><p className="text-sm font-medium text-muted-foreground">Início do Contrato</p><p className="font-semibold text-lg flex items-center gap-2 mt-1"><Calendar className="h-4 w-4 text-muted-foreground" />{property.contractStart ? format(new Date(property.contractStart), "dd/MM/yyyy", { locale: ptBR }) : "Não definido"}</p></div>
                <div><p className="text-sm font-medium text-muted-foreground">Fim do Contrato</p><p className="font-semibold text-lg flex items-center gap-2 mt-1"><Calendar className="h-4 w-4 text-muted-foreground" />{property.contractEnd ? format(new Date(property.contractEnd), "dd/MM/yyyy", { locale: ptBR }) : "Não definido"}</p></div>
                <div><p className="text-sm font-medium text-muted-foreground">Dia de Vencimento</p><p className="font-semibold text-lg flex items-center gap-2 mt-1"><Clock className="h-4 w-4 text-muted-foreground" />Todo dia {property.rentDueDay}</p></div>
              </div>
              <div className="bg-muted/30 p-5 rounded-xl border border-muted">
                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wider">Detalhamento Financeiro</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Aluguel Bruto:</span> <span className="font-semibold">{formatCurrency(property.rentAmount)}</span></div>
                  {property.isAgencyManaged && <div className="flex justify-between text-destructive"><span>Taxa Imobiliária:</span> <span>-{formatCurrency(property.agencyFee || 0)}</span></div>}
                  <div className="flex justify-between pt-2 border-t font-bold text-base mt-2"><span>Renda Líquida:</span> <span className="text-emerald-600">{formatCurrency(netIncome)}</span></div>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="history" className="mt-0">
             <div className="flex justify-between items-center border-b pb-4 mb-6">
               <div className="space-y-1">
                 <h3 className="text-lg font-bold font-display flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Histórico de Pagamentos</h3>
                 <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Dia de Vencimento: <span className="text-foreground font-bold">{property.rentDueDay}</span></p>
               </div>
               <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" onClick={() => setSelectedYear(selectedYear - 1)}>-</Button>
                 <span className="font-bold px-2">{selectedYear}</span>
                 <Button variant="outline" size="sm" onClick={() => setSelectedYear(selectedYear + 1)}>+</Button>
               </div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((monthName, index) => {
                 const payment = payments?.find(p => p.month === index);
                 const isPaid = !!payment;
                 const isLate = !isPaid && selectedYear <= currentYear && (selectedYear < currentYear || index <= currentMonth) && (selectedYear < currentYear || (index === currentMonth ? currentDay > property.rentDueDay : true));
                 return (
                   <div key={index} className={cn("p-4 border rounded-xl transition-all flex flex-col gap-3 relative cursor-pointer group", isPaid ? "bg-emerald-50 border-emerald-200 shadow-sm" : isLate ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40" : "bg-card border-muted hover:border-primary/30")} onClick={() => togglePaymentMutation.mutate({ month: index, year: selectedYear })}>
                     <div className="flex justify-between items-start">
                       <div className="flex flex-col"><span className={cn("font-bold", isPaid ? "text-emerald-700" : isLate ? "text-destructive" : "text-foreground")}>{monthName}</span><span className="text-[10px] text-muted-foreground">Vence dia {property.rentDueDay}</span></div>
                       <div className={cn("h-5 w-5 rounded border flex items-center justify-center transition-colors", isPaid ? "bg-emerald-500 border-emerald-500 text-white" : isLate ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-background border-muted group-hover:border-primary/50")}>{isPaid ? <Check className="h-3 w-3 stroke-[3]" /> : isLate ? <X className="h-3 w-3 stroke-[3]" /> : null}</div>
                     </div>
                     <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-1"><span className={cn("text-xs font-bold", isPaid ? "text-emerald-600" : isLate ? "text-destructive" : "text-muted-foreground")}>{isPaid ? "Pago" : isLate ? "Atrasado" : "Pendente"}</span>{isPaid && payment.paidAt && <span className="text-[10px] text-emerald-500/80">({format(new Date(payment.paidAt), "dd/MM")})</span>}</div>
                       <p className={cn("text-sm font-bold", isPaid ? "text-emerald-700" : isLate ? "text-destructive/80" : "text-muted-foreground/60")}>{formatCurrency(getRentForMonth(index))}</p>
                     </div>
                     {togglePaymentMutation.isPending && togglePaymentMutation.variables?.month === index && <div className="absolute inset-0 bg-white/50 rounded-xl flex items-center justify-center"><div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>}
                   </div>
                 );
               })}
             </div>
          </TabsContent>
          <TabsContent value="notes" className="mt-0">
            <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-4 mb-6"><FileText className="h-5 w-5 text-primary" /> Notas da Propriedade</h3>
            <form onSubmit={handleAddNote} className="mb-8 flex gap-3 items-start"><Textarea placeholder="Adicione uma nota..." className="resize-none flex-1 min-h-[80px]" value={newNote} onChange={(e) => setNewNote(e.target.value)} /><Button type="submit" disabled={createNote.isPending || !newNote.trim()}>Adicionar Nota</Button></form>
            <div className="space-y-4">
              {notes?.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhuma nota ainda.</p> : notes?.map(note => (
                <div key={note.id} className="p-4 bg-muted/30 border rounded-xl group relative"><p className="text-sm whitespace-pre-wrap pr-8">{note.content}</p><p className="text-xs text-muted-foreground mt-3 font-medium">{note.createdAt ? format(new Date(note.createdAt), "dd/MM/yyyy • HH:mm", { locale: ptBR }) : "Recentemente"}</p><Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all" onClick={() => deleteNote.mutate({ id: note.id, propertyId })}><Trash2 className="h-4 w-4" /></Button></div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="expenses" className="mt-0">
             <h3 className="text-lg font-bold font-display flex items-center gap-2 border-b pb-4 mb-6"><DollarSign className="h-5 w-5 text-primary" /> Manutenção & Despesas</h3>
             <form onSubmit={handleAddExpense} className="mb-8 p-5 bg-muted/30 border rounded-xl space-y-4"><h4 className="font-semibold text-sm">Registrar Nova Despesa</h4><div className="flex flex-col sm:flex-row gap-4"><Input placeholder="Descrição" className="flex-[2]" value={newExpenseDesc} onChange={(e) => setNewExpenseDesc(e.target.value)} /><Input type="number" placeholder="Valor (R$)" className="flex-1" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} /><Button type="submit" disabled={createExpense.isPending || !newExpenseDesc || !newExpenseAmount}>Adicionar Despesa</Button></div></form>
             <div className="space-y-3">
              {expenses?.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhuma despesa registrada.</p> : expenses?.map(expense => (
                <div key={expense.id} className="flex justify-between items-center p-4 border rounded-xl"><div><p className="font-semibold">{expense.description}</p><p className="text-xs text-muted-foreground mt-1">{expense.date ? format(new Date(expense.date), "dd/MM/yyyy", { locale: ptBR }) : "Recentemente"}</p></div><div className="flex items-center gap-4"><p className="font-bold text-destructive">-{formatCurrency(expense.amount)}</p><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={async () => {
    try {
      await deleteExpense.mutateAsync({ id: expense.id, propertyId });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao excluir despesa.", variant: "destructive" });
    }
}}><Trash2 className="h-4 w-4" /></Button></div></div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tenant" className="mt-0">
            <div className="flex flex-col space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-bold font-display flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Informações do Inquilino
                </h3>
                <Dialog open={isTenantDialogOpen} onOpenChange={setIsTenantDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      {tenant ? <><Edit className="h-4 w-4" /> Editar Informações</> : <><Plus className="h-4 w-4" /> Adicionar Inquilino</>}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:w-full sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader className="sticky top-0 bg-background pt-4 pb-2 -mx-6 px-6"><DialogTitle>{tenant ? "Editar Inquilino" : "Adicionar Inquilino"}</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const data = Object.fromEntries(formData.entries());
                      upsertTenantMutation.mutate({
                        name: data.name as string,
                        document: data.document as string,
                        phone: data.phone as string,
                        email: data.email as string,
                        birthDate: data.birthDate as string,
                        monthlyIncome: Number(data.monthlyIncome) || 0,
                        creditScore: Number(data.creditScore) || 0,
                        profession: data.profession as string,
                        employer: data.employer as string,
                        employmentTime: data.employmentTime as string,
                        emergencyContactName: data.emergencyContactName as string,
                        emergencyContactPhone: data.emergencyContactPhone as string,
                        residentCount: Number(data.residentCount) || 1,
                        hasPets: data.hasPets === "on",
                        petType: data.petType as string,
                        observations: data.observations as string,
                      }, {
                        onSuccess: () => setIsTenantDialogOpen(false),
                      });
                    }} className="space-y-5 pt-4 px-6 sm:px-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Nome Completo</label>
                          <Input name="name" defaultValue={tenant?.name} required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium">CPF ou Documento</label>
                          <Input name="document" defaultValue={tenant?.document || ""} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Telefone</label>
                          <Input name="phone" defaultValue={tenant?.phone || ""} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Email</label>
                          <Input name="email" type="email" defaultValue={tenant?.email || ""} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Data de Nascimento</label>
                          <Input name="birthDate" type="date" defaultValue={tenant?.birthDate || ""} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Renda Mensal (R$)</label>
                          <Input name="monthlyIncome" type="number" defaultValue={tenant?.monthlyIncome || ""} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Score de Crédito</label>
                          <Input name="creditScore" type="number" defaultValue={tenant?.creditScore || ""} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Profissão</label>
                          <Input name="profession" defaultValue={tenant?.profession || ""} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Empresa</label>
                          <Input name="employer" defaultValue={tenant?.employer || ""} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Tempo de Emprego</label>
                          <Input name="employmentTime" defaultValue={tenant?.employmentTime || ""} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Contato de Emergência</label>
                          <Input name="emergencyContactName" defaultValue={tenant?.emergencyContactName || ""} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Tel. Emergência</label>
                          <Input name="emergencyContactPhone" defaultValue={tenant?.emergencyContactPhone || ""} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Nº de Moradores</label>
                          <Input name="residentCount" type="number" defaultValue={tenant?.residentCount || 1} />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <input type="checkbox" name="hasPets" id="hasPets" defaultChecked={tenant?.hasPets || false} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                          <label htmlFor="hasPets" className="text-xs font-medium">Possui Animais</label>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium">Tipo de Animal</label>
                          <Input name="petType" defaultValue={tenant?.petType || ""} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Observações Gerais</label>
                        <Textarea name="observations" defaultValue={tenant?.observations || ""} className="min-h-[100px]" />
                      </div>
                      <Button type="submit" className="w-full" disabled={upsertTenantMutation.isPending}>
                        {upsertTenantMutation.isPending ? "Salvando..." : "Salvar Informações"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {isLoadingTenant ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-32 bg-muted rounded-xl" />
                  <div className="h-64 bg-muted rounded-xl" />
                </div>
              ) : tenant ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/10 shadow-sm">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-primary">{tenant.name}</h4>
                      <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> {tenant.document || "Doc não informado"}</span>
                        <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {tenant.phone || "Sem telefone"}</span>
                        <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {tenant.email || "Sem email"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-sm border-muted/60">
                      <CardContent className="p-6 space-y-4">
                        <h5 className="font-bold flex items-center gap-2 text-primary/80 border-b pb-2"><Wallet className="h-4 w-4" /> Informações Financeiras</h5>
                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                          <div><p className="text-muted-foreground text-xs uppercase tracking-wider">Renda Mensal</p><p className="font-bold text-emerald-600">{tenant.monthlyIncome ? formatCurrency(tenant.monthlyIncome) : "Não informada"}</p></div>
                          <div><p className="text-muted-foreground text-xs uppercase tracking-wider">Score de Crédito</p><p className="font-bold text-amber-600">{tenant.creditScore || "N/A"}</p></div>
                          <div className="col-span-2"><p className="text-muted-foreground text-xs uppercase tracking-wider">Profissão / Empresa</p><p className="font-semibold flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {tenant.profession || "N/A"} {tenant.employer ? `na ${tenant.employer}` : ""}</p></div>
                          <div><p className="text-muted-foreground text-xs uppercase tracking-wider">Tempo de Emprego</p><p className="font-medium">{tenant.employmentTime || "Não informado"}</p></div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border-muted/60">
                      <CardContent className="p-6 space-y-4">
                        <h5 className="font-bold flex items-center gap-2 text-primary/80 border-b pb-2"><ShieldCheck className="h-4 w-4" /> Contato de Emergência</h5>
                        <div className="space-y-4 text-sm">
                          <div><p className="text-muted-foreground text-xs uppercase tracking-wider">Nome do Contato</p><p className="font-bold">{tenant.emergencyContactName || "Não informado"}</p></div>
                          <div><p className="text-muted-foreground text-xs uppercase tracking-wider">Telefone</p><p className="font-bold flex items-center gap-1.5 text-primary"><Phone className="h-3.5 w-3.5" /> {tenant.emergencyContactPhone || "Não informado"}</p></div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border-muted/60 md:col-span-2">
                      <CardContent className="p-6 space-y-4">
                        <h5 className="font-bold flex items-center gap-2 text-primary/80 border-b pb-2"><Info className="h-4 w-4" /> Informações Adicionais</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                          <div><p className="text-muted-foreground text-xs uppercase tracking-wider">Moradores</p><p className="font-bold">{tenant.residentCount} {tenant.residentCount === 1 ? "pessoa" : "pessoas"}</p></div>
                          <div><p className="text-muted-foreground text-xs uppercase tracking-wider">Animais de Estimação</p><p className="font-bold flex items-center gap-1.5">{tenant.hasPets ? <><Heart className="h-4 w-4 text-rose-500 fill-rose-500" /> Sim ({tenant.petType})</> : "Não possui"}</p></div>
                          <div><p className="text-muted-foreground text-xs uppercase tracking-wider">Nascimento</p><p className="font-medium">{tenant.birthDate ? format(new Date(tenant.birthDate), "dd/MM/yyyy") : "Não informado"}</p></div>
                          <div className="md:col-span-3"><p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Observações</p><div className="bg-muted/30 p-3 rounded-lg text-xs italic">{tenant.observations || "Nenhuma observação."}</div></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-muted/10">
                  <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-bold text-lg mb-1">Nenhum inquilino cadastrado</h4>
                  <p className="text-muted-foreground mb-6">Cadastre as informações do locatário para esta propriedade.</p>
                  <Button onClick={() => setIsTenantDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Adicionar Inquilino
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="photos" className="mt-0">
            <div className="flex flex-col space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-bold font-display flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" /> Fotos do Imóvel
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-4 bg-muted/30 p-5 rounded-xl border border-muted">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      data-testid="input-file-photo"
                    />
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2 flex-1 sm:flex-none"
                      disabled={addPhotoMutation.isPending || isCompressing}
                      data-testid="button-select-photo"
                    >
                      <ImagePlus className="h-4 w-4" /> {isCompressing ? "Processando..." : "Selecionar Foto"}
                    </Button>
                    <div className="hidden sm:block text-xs text-muted-foreground self-center">ou</div>
                    <div className="flex-1 border-b-2 sm:border-b-0 sm:border-l-2 border-muted sm:pl-4" />
                  </div>
                  
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newPhotoUrl.trim()) {
                        addPhotoMutation.mutate(newPhotoUrl, {
                          onSuccess: () => setNewPhotoUrl(""),
                        });
                      }
                    }} 
                    className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end"
                  >
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Cole a URL da Imagem</label>
                      <Input 
                        placeholder="https://exemplo.com/foto.jpg" 
                        value={newPhotoUrl} 
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        className="h-10"
                        data-testid="input-photo-url"
                      />
                    </div>
                    <Button type="submit" className="gap-2 h-10 sm:h-auto sm:px-4" disabled={addPhotoMutation.isPending || !newPhotoUrl.trim()}>
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>

              <Dialog open={!!previewImage} onOpenChange={(open) => { if (!open) setPreviewImage(null); }}>
                <DialogContent className="w-[95vw] sm:w-full sm:max-w-[600px] rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Visualizar Foto Antes de Salvar</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {previewImage && (
                      <div className="relative bg-muted rounded-xl overflow-hidden">
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          className="w-full h-auto max-h-[400px] object-contain"
                        />
                      </div>
                    )}
                    <div className="flex gap-3 justify-end">
                      <Button 
                        variant="outline" 
                        onClick={() => setPreviewImage(null)}
                        data-testid="button-cancel-photo"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleConfirmPhoto}
                        disabled={isCompressing}
                        data-testid="button-confirm-photo"
                      >
                        Salvar Foto
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {isLoadingPhotos || isLoadingLocal ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => <div key={i} className="aspect-video bg-muted animate-pulse rounded-xl" />)}
                </div>
              ) : photos_list && photos_list.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos_list.map((photo: any) => (
                    <Card key={photo.id} className="overflow-hidden group relative border-none shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-0 aspect-video relative">
                        <img src={photo.url} alt="Foto do imóvel" className="w-full h-full object-cover" data-testid={`img-photo-${photo.id}`} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className={cn("h-8 gap-1.5", photo.isCover && "bg-amber-500 text-white hover:bg-amber-600 border-none")}
                            onClick={() => {
                              if (photos.length > 0) {
                                setLocalCoverPhoto(photo.id);
                              } else {
                                setCoverMutation.mutate(photo.id);
                              }
                            }}
                            disabled={setCoverMutation.isPending}
                            data-testid={`button-set-cover-${photo.id}`}
                          >
                            <Star className={cn("h-3.5 w-3.5", photo.isCover && "fill-current")} />
                            {photo.isCover ? "Capa" : "Definir Capa"}
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              if (photos.length > 0) {
                                deleteLocalPhoto(photo.id);
                                toast({ title: "Sucesso", description: "Foto removida com sucesso!" });
                              } else {
                                deletePhotoMutation.mutate(photo.id);
                              }
                            }}
                            disabled={deletePhotoMutation.isPending}
                            data-testid={`button-delete-photo-${photo.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {photo.isCover && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-none shadow-sm gap-1">
                              <Star className="h-3 w-3 fill-current" /> Capa
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/10">
                  <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Nenhuma foto cadastrada para este imóvel.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
