import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertNote } from "@shared/schema";

export function useNotes(propertyId: number) {
  const url = buildUrl(api.notes.list.path, { propertyId });
  return useQuery({
    queryKey: [url],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notes");
      return api.notes.list.responses[200].parse(await res.json());
    },
    enabled: !!propertyId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ propertyId, data }: { propertyId: number; data: Omit<InsertNote, "propertyId"> }) => {
      const url = buildUrl(api.notes.create.path, { propertyId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add note");
      return api.notes.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { propertyId }) => {
      const url = buildUrl(api.notes.list.path, { propertyId });
      queryClient.invalidateQueries({ queryKey: [url] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: number, propertyId: number }) => {
      const url = buildUrl(api.notes.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete note");
    },
    onSuccess: (_, { propertyId }) => {
      const url = buildUrl(api.notes.list.path, { propertyId });
      queryClient.invalidateQueries({ queryKey: [url] });
    },
  });
}
