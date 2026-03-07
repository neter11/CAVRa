import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Tenant, InsertTenant } from "@shared/schema";

export function useTenant(propertyId: number) {
  return useQuery<Tenant>({
    queryKey: ["/api/properties", propertyId, "tenant"],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${propertyId}/tenant`);
      if (res.status === 404) return null as any;
      if (!res.ok) throw new Error("Failed to fetch tenant");
      return res.json();
    },
    enabled: !!propertyId,
  });
}

export function useUpsertTenant(propertyId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<InsertTenant, "propertyId">) => {
      const res = await fetch(`/api/properties/${propertyId}/tenant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save tenant information");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "tenant"] });
      toast({ title: "Sucesso", description: "Informações do inquilino salvas com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}
