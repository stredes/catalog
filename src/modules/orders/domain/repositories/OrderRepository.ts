import { Order } from '../entities/Order';

export interface OrderRepository {
  save(order: Order): Promise<void>;
  update(order: Order): Promise<void>;
  findAll(): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  delete(id: string): Promise<void>;
  deleteAndRestoreStock(id: string): Promise<void>;
  getMaxOrderNumber(): Promise<number>;
  saveAndDecrementStock(
    order: Order,
    stockChanges: Array<{ productId: string; quantity: number }>,
    clearCart?: () => Promise<void>,
  ): Promise<{ orderNumber: number }>;
}
