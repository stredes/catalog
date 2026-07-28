import { Client } from "../../domain/entities/Client";
import { ClientRepository } from "../../domain/repositories/ClientRepository";

export class CreateClientUseCase {
  constructor(private repository: ClientRepository) {}
  async execute(input: Omit<Client, "id" | "createdAt" | "updatedAt">): Promise<Client> {
    if (input.rut) {
      const existing = await this.repository.findByRut(input.rut);
      if (existing) throw new Error("Ya existe un cliente con este RUT");
    }
    const now = new Date().toISOString();
    const client: Client = {
      id: "cli_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    await this.repository.create(client);
    return client;
  }
}

export class UpdateClientUseCase {
  constructor(private repository: ClientRepository) {}
  async execute(id: string, updates: Partial<Omit<Client, "id" | "createdAt">>): Promise<Client> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new Error("Cliente no encontrado");
    if (updates.rut) {
      const dup = await this.repository.findByRut(updates.rut);
      if (dup && dup.id !== id) throw new Error("Ya existe otro cliente con este RUT");
    }
    const updated: Client = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await this.repository.update(updated);
    return updated;
  }
}

export class DeleteClientUseCase {
  constructor(private repository: ClientRepository) {}
  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new Error("Cliente no encontrado");
    await this.repository.delete(id);
  }
}
