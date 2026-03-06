import { useState } from "react";
import { useTasks, useCreateTask, useCompleteTask, useDeleteTask } from "@/hooks/use-tasks";
import { useProperties } from "@/hooks/use-properties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ClipboardList, Plus, Trash2, MapPin, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

export default function Tasks() {
  const { data: tasks, isLoading: loadingTasks } = useTasks();
  const { data: properties } = useProperties();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      propertyId: undefined,
      cost: 0,
      dueDate: null,
      status: "pending"
    }
  });

  const onSubmit = async (data: any) => {
    try {
      await createTask.mutateAsync(data);
      toast({ title: "Sucesso", description: "Tarefa criada com sucesso." });
      setIsOpen(false);
      form.reset();
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao criar tarefa.", variant: "destructive" });
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (loadingTasks) {
    return <div className="p-8 animate-pulse space-y-4"><div className="h-10 bg-muted w-1/4 rounded"></div><div className="h-64 bg-muted rounded-xl"></div></div>;
  }

  const pendingTasks = tasks?.filter(t => t.status === "pending") || [];
  const completedTasks = tasks?.filter(t => t.status === "completed") || [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Tarefas</h1>
          <p className="text-muted-foreground mt-1">Gerencie manutenções e reparos.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Tarefa</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl><Input placeholder="Ex: Conserto do telhado" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl><Textarea placeholder="Detalhes do reparo..." {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="propertyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Propriedade</FormLabel>
                        <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString()}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {properties?.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo (R$)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Limite</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""} 
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createTask.isPending}>Criar Tarefa</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold font-display">Pendentes ({pendingTasks.length})</h2>
          </div>
          {pendingTasks.length === 0 ? (
            <p className="text-muted-foreground bg-muted/30 p-8 rounded-xl border border-dashed text-center">Nenhuma tarefa pendente.</p>
          ) : (
            pendingTasks.map(task => (
              <Card key={task.id} className="group hover:border-primary/30 transition-colors shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-start p-5 gap-4">
                    <Checkbox 
                      className="mt-1" 
                      onCheckedChange={() => {
                        completeTask.mutate(task.id);
                        toast({ title: "Tarefa Concluída", description: "A tarefa foi movida para despesas da propriedade." });
                      }}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between">
                        <h4 className="font-bold text-lg leading-none">{task.title}</h4>
                        <span className="font-bold text-amber-600">{formatCurrency(task.cost)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                      
                      <div className="flex flex-wrap gap-3 pt-3 text-xs text-muted-foreground font-medium">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {properties?.find(p => p.id === task.propertyId)?.name}
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Até {format(new Date(task.dueDate), "dd/MM/yyyy")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h2 className="text-xl font-bold font-display text-muted-foreground">Concluídas ({completedTasks.length})</h2>
          </div>
          {completedTasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma tarefa concluída recentemente.</p>
          ) : (
            completedTasks.map(task => (
              <Card key={task.id} className="opacity-70 bg-muted/20 grayscale-[0.5]">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-bold line-through text-muted-foreground">{task.title}</h4>
                      <p className="text-xs text-muted-foreground">{properties?.find(p => p.id === task.propertyId)?.name}</p>
                      <Badge variant="outline" className="mt-2 text-emerald-600 border-emerald-200 bg-emerald-50">Convertido em Despesa</Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-muted-foreground">{formatCurrency(task.cost)}</p>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive mt-2" onClick={() => deleteTask.mutate(task.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
