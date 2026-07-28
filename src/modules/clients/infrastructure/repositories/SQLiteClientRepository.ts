import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { Client } from '../../domain/entities/Client';
import { ClientRepository } from '../../domain/repositories/ClientRepository';

type ClientRow = {
  id: string;
  name: string;
  rut: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function rowToClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    rut: row.rut ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class SQLiteClientRepository implements ClientRepository {
  async findAll(): Promise<Client[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ClientRow>(
      'SELECT id, name, rut, phone, email, notes, createdAt, updatedAt FROM clients ORDER BY name ASC',
    );
    return rows.map(rowToClient);
  }

  async findById(id: string): Promise<Client | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ClientRow>(
      'SELECT id, name, rut, phone, email, notes, createdAt, updatedAt FROM clients WHERE id = ?',
      id,
    );
    return row ? rowToClient(row) : null;
  }

  async findByRut(rut: string): Promise<Client | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ClientRow>(
      'SELECT id, name, rut, phone, email, notes, createdAt, updatedAt FROM clients WHERE rut = ?',
      rut,
    );
    return row ? rowToClient(row) : null;
  }

  async create(client: Client): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO clients (id, name, rut, phone, email, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      client.id,
      client.name,
      client.rut ?? null,
      client.phone ?? null,
      client.email ?? null,
      client.notes ?? null,
      client.createdAt,
      client.updatedAt,
    );
  }

  async update(client: Client): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE clients
       SET name = ?, rut = ?, phone = ?, email = ?, notes = ?, updatedAt = ?
       WHERE id = ?`,
      client.name,
      client.rut ?? null,
      client.phone ?? null,
      client.email ?? null,
      client.notes ?? null,
      client.updatedAt,
      client.id,
    );
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM clients WHERE id = ?', id);
  }
}
