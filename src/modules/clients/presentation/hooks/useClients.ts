import { useState, useEffect, useCallback } from "react";
import { Client } from "../../domain/entities/Client";
import { ClientRepository } from "../../domain/repositories/ClientRepository";

export function useClients(repository: ClientRepository) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await repository.findAll();
      setClients(data);
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (input: Omit<Client, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const client: Client = {
      id: "cli_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    await repository.create(client);
    await load();
    return client;
  }, [repository, load]);

  const update = useCallback(async (id: string, updates: Partial<Omit<Client, "id" | "createdAt">>) => {
    const existing = await repository.findById(id);
    if (!existing) throw new Error("Cliente no encontrado");
    const updated: Client = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await repository.update(updated);
    await load();
    return updated;
  }, [repository, load]);

  const remove = useCallback(async (id: string) => {
    await repository.delete(id);
    await load();
  }, [repository, load]);

  return { clients, loading, reload: load, create, update, remove };
}
