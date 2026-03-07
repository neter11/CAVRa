import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertTask, Task } from "@shared/schema";

export function useTasks() {
  return useQuery({
    queryKey: [api.tasks.list.path],
    queryFn: async () => {
      const res = await fetch(api.tasks.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return api.tasks.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTask) => {
      const res = await fetch(api.tasks.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create task");
      }
      return api.tasks.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-expenses"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<InsertTask> }) => {
      const url = buildUrl(api.tasks.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update task");
      return api.tasks.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-expenses"] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tasks.complete.path, { id });
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to complete task");
      return api.tasks.complete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-expenses"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tasks.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-expenses"] });
    },
  });
}

export function useTaskCounts() {
  return useQuery({
    queryKey: ["/api/tasks/counts/affected"],
    queryFn: async () => {
      const res = await fetch("/api/tasks/counts/affected", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch task counts");
      return res.json() as Promise<{ month: number; completed: number; all: number }>;
    },
  });
}

export function useResetTasksMonth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tasks/reset/month", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reset month tasks");
      return res.json() as Promise<{ deletedCount: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/counts/affected"] });
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-expenses"] });
    },
  });
}

export function useResetTasksCompleted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tasks/reset/completed", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reset completed tasks");
      return res.json() as Promise<{ deletedCount: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/counts/affected"] });
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-expenses"] });
    },
  });
}

export function useResetTasksAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tasks/reset/all", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reset all tasks");
      return res.json() as Promise<{ deletedCount: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/counts/affected"] });
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-expenses"] });
    },
  });
}
