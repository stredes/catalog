import { Order } from '../entities/Order';

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findAll(): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  delete(id: string): Promise<void>;
}
