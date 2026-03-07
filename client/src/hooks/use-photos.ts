import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function usePropertyPhotos(propertyId: number) {
  return useQuery({
    queryKey: ["/api/properties", propertyId, "photos"],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${propertyId}/photos`);
      if (!res.ok) throw new Error("Failed to fetch photos");
      return res.json();
    },
    enabled: !!propertyId,
  });
}

export function useAddPropertyPhoto(propertyId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch(`/api/properties/${propertyId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error("Failed to add photo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "photos"] });
      toast({ title: "Sucesso", description: "Foto adicionada com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeletePropertyPhoto(propertyId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (photoId: number) => {
      const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete photo");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "photos"] });
      toast({ title: "Sucesso", description: "Foto removida com sucesso!" });
    },
  });
}

export function useSetCoverPhoto(propertyId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (photoId: number) => {
      const res = await fetch(`/api/photos/${photoId}/cover`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to set cover photo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "photos"] });
      queryClient.invalidateQueries({ queryKey: [api.properties.get.path, propertyId] });
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      toast({ title: "Sucesso", description: "Capa definida com sucesso!" });
    },
  });
}
