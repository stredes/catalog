import { Order } from '../../domain/entities/Order';
import { Profile } from '../../../profile/domain/entities/profile';
import { OrderPdfGenerator } from '../../infrastructure/OrderPdfGenerator';

export class GenerateOrderPdfUseCase {
  constructor(private readonly pdfGenerator: OrderPdfGenerator) {}

  async execute(order: Order, profile: Profile | null): Promise<string> {
    return this.pdfGenerator.generate(order, profile);
  }
}
