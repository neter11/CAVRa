import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateProperty, useUpdateProperty } from "@/hooks/use-properties";
import type { Property } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  location: z.string().min(1, "A localização é obrigatória"),
  type: z.string().min(1, "O tipo é obrigatório"),
  rentAmount: z.coerce.number().min(0, "Deve ser um valor positivo"),
  rentDueDay: z.coerce.number().min(1).max(31).default(5),
  isAgencyManaged: z.boolean().default(false),
  agencyFee: z.coerce.number().min(0).default(0),
  status: z.string().default("available"),
  contractStart: z.coerce.date().optional().nullable(),
  contractEnd: z.coerce.date().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  rentHistory: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

export function PropertyForm({
  initialData,
  onSuccess,
}: {
  initialData?: Property;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      contractStart: initialData.contractStart ? new Date(initialData.contractStart) : null,
      contractEnd: initialData.contractEnd ? new Date(initialData.contractEnd) : null,
    } : {
      name: "",
      location: "",
      type: "apartment",
      rentAmount: 0,
      rentDueDay: 5,
      isAgencyManaged: false,
      agencyFee: 0,
      status: "available",
      imageUrl: "",
      rentHistory: [JSON.stringify({ value: 0, startMonth: 0 })],
    },
  });

  const isAgencyManaged = form.watch("isAgencyManaged");
  const rent = form.watch("rentAmount");
  const fee = form.watch("agencyFee");
  const netIncome = rent - (isAgencyManaged ? fee : 0);

  const onSubmit = async (values: FormValues) => {
    try {
      const data = {
        ...values,
        contractStart: values.contractStart ? new Date(values.contractStart) : null,
        contractEnd: values.contractEnd ? new Date(values.contractEnd) : null,
        imageUrl: values.imageUrl || null,
        agencyFee: values.isAgencyManaged ? values.agencyFee : 0,
        rentHistory: initialData?.rentHistory || [JSON.stringify({ value: values.rentAmount, startMonth: 0 })],
      };

      if (initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, updates: data });
        toast({ title: "Sucesso", description: "Propriedade atualizada com sucesso." });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: "Sucesso", description: "Propriedade adicionada com sucesso." });
      }
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar a propriedade.",
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 sm:px-0">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Nome da Propriedade</FormLabel>
                <FormControl><Input placeholder="Apartamento Solar" className="h-10" {...field} /></FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Localização</FormLabel>
                <FormControl><Input placeholder="Rua Principal, 123" className="h-10" {...field} /></FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="apartment">Apartamento</SelectItem>
                    <SelectItem value="house">Casa</SelectItem>
                    <SelectItem value="countryside">Chácara/Sítio</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="rented">Alugado</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-muted/50 p-4 sm:p-5 rounded-xl border space-y-4 mx-6 sm:mx-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="rentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Valor do Aluguel (R$)</FormLabel>
                  <FormControl><Input type="number" className="h-10" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rentDueDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Dia de Vencimento</FormLabel>
                  <FormControl><Input type="number" className="h-10" min={1} max={31} {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isAgencyManaged"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md sm:p-0 sm:pt-6">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium">Gerenciado por Imobiliária</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {isAgencyManaged && (
            <FormField
              control={form.control}
              name="agencyFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Taxa da Imobiliária (R$)</FormLabel>
                  <FormControl><Input type="number" className="h-10" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          )}

          <div className="pt-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs sm:text-sm font-medium border-t">
            <span className="text-muted-foreground">Renda Líquida Estimada:</span>
            <span className="text-base sm:text-lg text-primary font-semibold">R$ {netIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 sm:px-0">
          <FormField
            control={form.control}
            name="contractStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Início do Contrato</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    className="h-10"
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contractEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Fim do Contrato</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    className="h-10"
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem className="px-6 sm:px-0">
              <FormLabel className="text-sm font-medium">URL da Imagem (Opcional)</FormLabel>
              <FormControl><Input placeholder="https://..." className="h-10" {...field} value={field.value || ''} /></FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4 px-6 sm:px-0 sticky bottom-0 bg-background">
          <Button type="submit" disabled={isPending} className="flex-1 sm:flex-initial h-10 sm:h-auto sm:px-8">
            {isPending ? "Salvando..." : initialData ? "Atualizar Propriedade" : "Adicionar Propriedade"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
