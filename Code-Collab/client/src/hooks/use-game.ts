import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCases() {
  return useQuery({
    queryKey: [api.cases.list.path],
    queryFn: async () => {
      const res = await fetch(api.cases.list.path);
      if (!res.ok) throw new Error("Failed to fetch cases");
      return api.cases.list.responses[200].parse(await res.json());
    },
  });
}

export function useCase(id: number) {
  return useQuery({
    queryKey: [api.cases.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.cases.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch case");
      return api.cases.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useOpenCase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.cases.open.path, { id });
      const res = await fetch(url, {
        method: api.cases.open.method,
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Please login to open cases");
        if (res.status === 400) throw new Error("Insufficient funds");
        throw new Error("Failed to open case");
      }

      return api.cases.open.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      // Invalidate profile to update balance and stats
      queryClient.invalidateQueries({ queryKey: [api.profile.get.path] });
      // Invalidate inventory
      queryClient.invalidateQueries({ queryKey: [api.inventory.list.path] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useInventory() {
  return useQuery({
    queryKey: [api.inventory.list.path],
    queryFn: async () => {
      const res = await fetch(api.inventory.list.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch inventory");
      return api.inventory.list.responses[200].parse(await res.json());
    },
  });
}

export function useSellItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.inventory.sell.path, { id });
      const res = await fetch(url, {
        method: api.inventory.sell.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to sell item");
      return api.inventory.sell.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.inventory.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.profile.get.path] });
      toast({
        title: "Item Sold",
        description: `Sold for $${(data.soldAmount / 100).toFixed(2)}`,
        variant: "default",
      });
    },
  });
}

export function useSellAll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.inventory.sellAll.path, {
        method: api.inventory.sellAll.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to sell all items");
      return api.inventory.sellAll.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.inventory.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.profile.get.path] });
      toast({
        title: "All Items Sold",
        description: `Sold ${data.soldCount} items for $${(data.totalAmount / 100).toFixed(2)}`,
        variant: "default",
      });
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: [api.profile.get.path],
    queryFn: async () => {
      const res = await fetch(api.profile.get.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return api.profile.get.responses[200].parse(await res.json());
    },
  });
}
