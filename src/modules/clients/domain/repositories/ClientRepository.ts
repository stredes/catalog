import { Client } from '../entities/Client';

export interface ClientRepository {
  findAll(): Promise<Client[]>;
  findById(id: string): Promise<Client | null>;
  findByRut(rut: string): Promise<Client | null>;
  create(client: Client): Promise<void>;
  update(client: Client): Promise<void>;
  delete(id: string): Promise<void>;
}
