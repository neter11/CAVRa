import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertExpense } from "@shared/schema";

export function useExpenses(propertyId: number) {
  const url = buildUrl(api.expenses.list.path, { propertyId });
  return useQuery({
    queryKey: [url],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return api.expenses.list.responses[200].parse(await res.json());
    },
    enabled: !!propertyId,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ propertyId, data }: { propertyId: number; data: Omit<InsertExpense, "propertyId"> }) => {
      const url = buildUrl(api.expenses.create.path, { propertyId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add expense");
      return api.expenses.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { propertyId }) => {
      const url = buildUrl(api.expenses.list.path, { propertyId });
      queryClient.invalidateQueries({ queryKey: [url] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: number, propertyId: number }) => {
      const url = buildUrl(api.expenses.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete expense");
    },
    onSuccess: (_, { propertyId }) => {
      const url = buildUrl(api.expenses.list.path, { propertyId });
      queryClient.invalidateQueries({ queryKey: [url] });
    },
  });
}
